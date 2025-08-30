const express = require('express');
const { requireAuth, requireAdmin, requireDoctorOrAdmin } = require('../middleware/auth');
const { TenantApplication, TenantApplicationNotFoundError } = require('../models/TenantApplication');
const { UserApplicationAccess, UserApplicationAccessNotFoundError } = require('../models/UserApplicationAccess');
const { Application, ApplicationNotFoundError } = require('../models/Application');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/entitlements/tenant
 * Get all application licenses for current tenant
 */
router.get('/tenant', requireAuth, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { includeExpired = false, limit = 50, offset = 0 } = req.query;
    
    const licenses = await TenantApplication.findByTenant(tenantId, {
      includeExpired: includeExpired === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      licenses: licenses.map(license => license.toJSON()),
      tenantId
    });
  } catch (error) {
    console.error('Error fetching tenant licenses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant licenses'
    });
  }
});

/**
 * GET /api/entitlements/tenant/:applicationSlug
 * Get specific tenant license details
 */
router.get('/tenant/:applicationSlug', requireAuth, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { applicationSlug } = req.params;
    
    const licenseInfo = await TenantApplication.getLicenseInfo(tenantId, applicationSlug);
    
    if (!licenseInfo) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No license found for application: ${applicationSlug}`
      });
    }
    
    res.json({
      license: licenseInfo,
      isActive: licenseInfo.status === 'active' && (!licenseInfo.expires_at || new Date(licenseInfo.expires_at) > new Date())
    });
  } catch (error) {
    console.error('Error fetching tenant license:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant license'
    });
  }
});

/**
 * GET /api/entitlements/users
 * Get user application access for current tenant (admin/doctor only)
 */
router.get('/users', requireAuth, requireDoctorOrAdmin, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { applicationSlug, userId, roleInApp, limit = 50, offset = 0 } = req.query;
    
    let userAccess;
    
    if (userId) {
      // Get access for specific user
      const options = {};
      if (applicationSlug) {
        const app = await Application.findBySlug(applicationSlug);
        options.applicationId = app.id;
      }
      
      userAccess = await UserApplicationAccess.findByUser(
        parseInt(userId), 
        tenantId, 
        { ...options, limit: parseInt(limit), offset: parseInt(offset) }
      );
    } else if (applicationSlug) {
      // Get all users for specific application
      const app = await Application.findBySlug(applicationSlug);
      userAccess = await UserApplicationAccess.findByApplication(
        app.id, 
        tenantId, 
        { roleInApp, limit: parseInt(limit), offset: parseInt(offset) }
      );
    } else {
      // Get all user access for tenant (this could be expensive, consider pagination)
      const database = require('../config/database');
      const query = `
        SELECT uaa.*, u.name as user_name, u.email as user_email, u.role as user_role,
               a.name as app_name, a.slug as app_slug, a.description as app_description
        FROM public.user_application_access uaa
        INNER JOIN public.users u ON uaa.user_id = u.id
        INNER JOIN public.applications a ON uaa.application_id = a.id
        WHERE uaa.tenant_id = $1 AND uaa.is_active = true
          AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())
        ORDER BY uaa.granted_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await database.query(query, [tenantId, parseInt(limit), parseInt(offset)]);
      userAccess = result.rows.map(row => new UserApplicationAccess(row));
    }
    
    res.json({
      userAccess: userAccess.map(access => access.toJSON())
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error fetching user access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user access'
    });
  }
});

/**
 * POST /api/entitlements/users/:userId/grant
 * Grant user access to application (admin only)
 */
router.post('/users/:userId/grant', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: grantedBy } = req.user;
    const { applicationSlug, roleInApp = 'user', expiresAt } = req.body;
    
    if (!applicationSlug) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Application slug is required'
      });
    }
    
    // Verify user exists in tenant
    await User.findById(parseInt(userId), tenantId);
    
    // Get application
    const application = await Application.findBySlug(applicationSlug);
    
    const access = await UserApplicationAccess.grantAccess({
      userId: parseInt(userId),
      applicationId: application.id,
      tenantId,
      roleInApp,
      grantedBy,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    res.status(201).json({
      message: 'Access granted successfully',
      access: access.toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError || error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error.message.includes('already has access') || error.message.includes('Maximum user limit')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    
    console.error('Error granting user access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to grant user access'
    });
  }
});

/**
 * PUT /api/entitlements/users/:userId/revoke
 * Revoke user access to application (admin only)
 */
router.put('/users/:userId/revoke', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: revokedBy } = req.user;
    const { applicationSlug } = req.body;
    
    if (!applicationSlug) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Application slug is required'
      });
    }
    
    // Get application
    const application = await Application.findBySlug(applicationSlug);
    
    // Find user access
    const userAccess = await UserApplicationAccess.findByUser(
      parseInt(userId), 
      tenantId, 
      { applicationId: application.id }
    );
    
    if (userAccess.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User access not found for this application'
      });
    }
    
    await userAccess[0].revoke(revokedBy);
    
    res.json({
      message: 'Access revoked successfully',
      access: userAccess[0].toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error revoking user access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke user access'
    });
  }
});

/**
 * GET /api/entitlements/users/:userId/applications
 * Get applications a specific user has access to (admin/doctor or self)
 */
router.get('/users/:userId/applications', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: currentUserId, role } = req.user;
    
    // Check if user can access this information
    if (parseInt(userId) !== currentUserId && !['admin', 'doctor'].includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Can only view your own applications or require admin/doctor privileges'
      });
    }
    
    const userAccess = await UserApplicationAccess.findByUser(
      parseInt(userId), 
      tenantId, 
      { isActive: true }
    );
    
    res.json({
      userId: parseInt(userId),
      applications: userAccess.map(access => access.toJSON())
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user applications'
    });
  }
});

// Admin-only routes for tenant license management
router.use(requireAuth, requireAdmin);

/**
 * POST /api/entitlements/tenant/grant
 * Grant tenant license for application (admin only)
 */
router.post('/tenant/grant', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { applicationSlug, maxUsers, expiresAt } = req.body;
    
    if (!applicationSlug) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Application slug is required'
      });
    }
    
    const application = await Application.findBySlug(applicationSlug);
    
    const license = await TenantApplication.grantLicense({
      tenantId,
      applicationId: application.id,
      maxUsers: maxUsers ? parseInt(maxUsers) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    res.status(201).json({
      message: 'Tenant license granted successfully',
      license: license.toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    
    console.error('Error granting tenant license:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to grant tenant license'
    });
  }
});

/**
 * PUT /api/entitlements/tenant/:applicationSlug
 * Update tenant license (admin only)
 */
router.put('/tenant/:applicationSlug', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { applicationSlug } = req.params;
    const updates = req.body;
    
    const application = await Application.findBySlug(applicationSlug);
    const tenantApp = await TenantApplication.findByTenantAndApplication(tenantId, application.id);
    
    await tenantApp.update(updates);
    
    res.json({
      message: 'Tenant license updated successfully',
      license: tenantApp.toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError || error instanceof TenantApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error updating tenant license:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update tenant license'
    });
  }
});

/**
 * GET /api/entitlements/logs
 * Get access logs (admin only)
 */
router.get('/logs', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { userId, applicationSlug, days = 7, limit = 100, offset = 0 } = req.query;
    
    let applicationId = null;
    if (applicationSlug) {
      const application = await Application.findBySlug(applicationSlug);
      applicationId = application.id;
    }
    
    const logs = await UserApplicationAccess.getAccessLogs(
      userId ? parseInt(userId) : null, 
      tenantId, 
      {
        applicationId,
        days: parseInt(days),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    );
    
    res.json({
      logs,
      filters: {
        tenantId,
        userId: userId ? parseInt(userId) : null,
        applicationSlug,
        days: parseInt(days)
      }
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error fetching access logs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch access logs'
    });
  }
});

module.exports = router;