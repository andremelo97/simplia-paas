const express = require('express');
const { requireAuth, requireAdmin, requireManagerOrAdmin } = require('../../../infra/middleware/auth');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { TenantApplication, TenantApplicationNotFoundError } = require('../../../infra/models/TenantApplication');
const { UserApplicationAccess, UserApplicationAccessNotFoundError } = require('../../../infra/models/UserApplicationAccess');
const { Application, ApplicationNotFoundError } = require('../../../infra/models/Application');
const User = require('../../../infra/models/User');

const router = express.Router();

// Apply tenant middleware to all entitlement routes (tenant-scoped)
router.use(tenantMiddleware);

// Apply authentication to all entitlement routes
router.use(requireAuth);

/**
 * @openapi
 * /entitlements:
 *   get:
 *     tags: [Entitlements (Tenant-scoped)]
 *     summary: List tenant licenses
 *     description: Get all application licenses for the current tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier (e.g., "1")
 *         example: "1"
 *       - in: query
 *         name: includeExpired
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include expired licenses in results
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, trial, expired, suspended]
 *         description: Filter by license status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of licenses to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of licenses to skip
 *     responses:
 *       200:
 *         description: Tenant licenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenantId: { type: string }
 *                     tenantName: { type: string }
 *                     licenses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           applicationId: { type: integer }
 *                           applicationSlug: { type: string }
 *                           applicationName: { type: string }
 *                           status: { type: string }
 *                           userLimit: { type: integer }
 *                           seatsUsed: { type: integer }
 *                           seatsAvailable: { type: integer }
 *                           expiryDate: { type: string }
 *                           activatedAt: { type: string }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *       400:
 *         description: Missing or invalid tenant header
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', requireManagerOrAdmin, async (req, res) => {
  try {
    const tenantId = req.tenant.id; // Use numeric ID
    const { includeExpired = false, status, limit = 50, offset = 0 } = req.query;
    
    const options = {
      includeExpired: includeExpired === 'true',
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    const licenses = await TenantApplication.findByTenant(tenantId, options);
    const totalLicenses = await TenantApplication.count(tenantId, { status, includeExpired: options.includeExpired });
    
    res.json({
      success: true,
      data: {
        tenantId,
        tenantName: req.tenant.name,
        licenses: licenses.map(license => ({
          ...license.toJSON(),
          seatsAvailable: license.user_limit - license.seats_used
        })),
        pagination: {
          total: totalLicenses,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + licenses.length < totalLicenses
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tenant licenses:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch tenant licenses'
      }
    });
  }
});

/**
 * @openapi
 * /entitlements/{applicationSlug}:
 *   get:
 *     tags: [Entitlements (Tenant-scoped)]
 *     summary: Get specific license details
 *     description: Get detailed information about a specific application license for the tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier (e.g., "1")
 *         example: "1"
 *       - in: path
 *         name: applicationSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tq, pm, billing, reports]
 *         description: Application slug
 *     responses:
 *       200:
 *         description: License details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     license:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         applicationSlug: { type: string }
 *                         applicationName: { type: string }
 *                         status: { type: string }
 *                         userLimit: { type: integer }
 *                         seatsUsed: { type: integer }
 *                         seatsAvailable: { type: integer }
 *                         expiryDate: { type: string }
 *                         activatedAt: { type: string }
 *                         createdAt: { type: string }
 *                         updatedAt: { type: string }
 *                     isActive: { type: boolean }
 *                     seatUtilization:
 *                       type: object
 *                       properties:
 *                         percentage: { type: number }
 *                         available: { type: integer }
 *                         used: { type: integer }
 *                         limit: { type: integer }
 *       404:
 *         description: License not found for this application
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:applicationSlug', requireManagerOrAdmin, async (req, res) => {
  try {
    const tenantId = req.tenant.id; // Use numeric ID
    const { applicationSlug } = req.params;
    
    const licenseInfo = await TenantApplication.getLicenseInfo(tenantId, applicationSlug);
    
    if (!licenseInfo) {
      return res.status(404).json({
        error: {
          code: 404,
          message: `No license found for application: ${applicationSlug}`
        }
      });
    }
    
    const isActive = licenseInfo.status === 'active' && 
                    (!licenseInfo.expiry_date || new Date(licenseInfo.expiry_date) > new Date());
    
    const seatUtilization = {
      used: licenseInfo.seats_used || 0,
      limit: licenseInfo.user_limit || 0,
      available: (licenseInfo.user_limit || 0) - (licenseInfo.seats_used || 0),
      percentage: licenseInfo.user_limit ? 
        Math.round(((licenseInfo.seats_used || 0) / licenseInfo.user_limit) * 100) : 0
    };
    
    res.json({
      success: true,
      data: {
        license: {
          ...licenseInfo,
          seatsAvailable: seatUtilization.available
        },
        isActive,
        seatUtilization
      }
    });
  } catch (error) {
    console.error('Error fetching tenant license:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch tenant license'
      }
    });
  }
});

/**
 * GET /api/entitlements/users
 * Get user application access for current tenant (admin/manager only)
 */
router.get('/users', requireAuth, requireManagerOrAdmin, async (req, res) => {
  try {
    const tenantId = req.tenant.id; // Use numeric ID
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
      const database = require('../../../infra/db/database');
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
    const tenantId = req.tenant.id; // Use numeric ID
    const { userId: grantedBy } = req.user;
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
    const tenantId = req.tenant.id; // Use numeric ID
    const { userId: revokedBy } = req.user;
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
 * Get applications a specific user has access to (admin/manager or self)
 */
router.get('/users/:userId/applications', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant.id; // Use numeric ID
    const { userId: currentUserId, role } = req.user;
    
    // Check if user can access this information
    if (parseInt(userId) !== currentUserId && !['admin', 'manager'].includes(role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Can only view your own applications or require admin/manager privileges'
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

/**
 * @openapi
 * /entitlements/{applicationSlug}/activate:
 *   post:
 *     tags: [Entitlements (Tenant-scoped)]
 *     summary: Activate license for application
 *     description: Activate or create a license for a specific application within the tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier (e.g., "1")
 *         example: "1"
 *       - in: path
 *         name: applicationSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tq, pm, billing, reports]
 *         description: Application slug to activate license for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userLimit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 description: Maximum number of users allowed
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: License expiry date (YYYY-MM-DD format, optional)
 *               status:
 *                 type: string
 *                 enum: [active, trial]
 *                 default: active
 *                 description: License status
 *     responses:
 *       201:
 *         description: License activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     license:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         applicationSlug: { type: string }
 *                         applicationName: { type: string }
 *                         status: { type: string }
 *                         userLimit: { type: integer }
 *                         seatsUsed: { type: integer }
 *                         seatsAvailable: { type: integer }
 *                         expiryDate: { type: string }
 *                         activatedAt: { type: string }
 *       409:
 *         description: License already exists and is active
 *       404:
 *         description: Application not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:applicationSlug/activate', requireAdmin, async (req, res) => {
  try {
    const { applicationSlug } = req.params;
    const { userLimit, expiryDate, status = 'active' } = req.body;
    const tenantId = req.tenant.id; // Use numeric ID
    
    // Get application
    const application = await Application.findBySlug(applicationSlug);
    
    // Check if license already exists
    const existingLicense = await TenantApplication.findByTenantAndApplication(tenantId, application.id)
      .catch(() => null); // License doesn't exist, which is fine
    
    if (existingLicense && existingLicense.status === 'active') {
      return res.status(409).json({
        error: {
          code: 409,
          message: `License for ${applicationSlug} is already active`
        }
      });
    }
    
    // Create or reactivate license
    const license = await TenantApplication.grantLicense({
      tenantId,
      applicationId: application.id,
      userLimit: userLimit ? parseInt(userLimit) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status
    });
    
    res.status(201).json({
      success: true,
      message: `License for ${applicationSlug} activated successfully`,
      data: {
        license: {
          ...license.toJSON(),
          applicationSlug,
          applicationName: application.name,
          seatsAvailable: (license.user_limit || 0) - (license.seats_used || 0)
        }
      }
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }
    
    console.error('Error activating license:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to activate license'
      }
    });
  }
});

/**
 * @openapi
 * /entitlements/{applicationSlug}/adjust:
 *   put:
 *     tags: [Entitlements (Tenant-scoped)]
 *     summary: Adjust license settings
 *     description: Modify existing license settings like user limits, status, or expiry date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier (e.g., "1")
 *         example: "1"
 *       - in: path
 *         name: applicationSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tq, pm, billing, reports]
 *         description: Application slug to adjust license for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userLimit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 description: New maximum number of users allowed
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 description: New license expiry date (YYYY-MM-DD format)
 *               status:
 *                 type: string
 *                 enum: [active, trial, expired, suspended]
 *                 description: New license status
 *           examples:
 *             increase_user_limit:
 *               summary: Increase user limit
 *               value:
 *                 userLimit: 100
 *             extend_license:
 *               summary: Extend license expiry
 *               value:
 *                 expiryDate: "2025-12-31"
 *             suspend_license:
 *               summary: Suspend license
 *               value:
 *                 status: "suspended"
 *     responses:
 *       200:
 *         description: License adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     license:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         applicationSlug: { type: string }
 *                         applicationName: { type: string }
 *                         status: { type: string }
 *                         userLimit: { type: integer }
 *                         seatsUsed: { type: integer }
 *                         seatsAvailable: { type: integer }
 *                         expiryDate: { type: string }
 *                         updatedAt: { type: string }
 *       404:
 *         description: License not found for this application
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:applicationSlug/adjust', requireAdmin, async (req, res) => {
  try {
    const { applicationSlug } = req.params;
    const { userLimit, expiryDate, status } = req.body;
    const tenantId = req.tenant.id; // Use numeric ID
    
    // Get application
    const application = await Application.findBySlug(applicationSlug);
    
    // Find existing license
    const license = await TenantApplication.findByTenantAndApplication(tenantId, application.id);
    
    // Prepare updates
    const updates = {};
    if (userLimit !== undefined) updates.user_limit = parseInt(userLimit);
    if (expiryDate !== undefined) updates.expiry_date = new Date(expiryDate);
    if (status !== undefined) updates.status = status;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'At least one field must be provided to adjust'
        }
      });
    }
    
    // Update license
    await license.update(updates);
    
    res.json({
      success: true,
      message: `License for ${applicationSlug} adjusted successfully`,
      data: {
        license: {
          ...license.toJSON(),
          applicationSlug,
          applicationName: application.name,
          seatsAvailable: (license.user_limit || 0) - (license.seats_used || 0)
        }
      }
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError || error instanceof TenantApplicationNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }
    
    console.error('Error adjusting license:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to adjust license'
      }
    });
  }
});


/**
 * GET /api/entitlements/logs
 * Get access logs (admin only)
 */
router.get('/logs', async (req, res) => {
  try {
    const tenantId = req.tenant.id; // Use numeric ID
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