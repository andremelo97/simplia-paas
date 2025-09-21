const express = require('express');
const { requireAuth, requireAdmin, requireManagerOrAdmin } = require('../../../infra/middleware/auth');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const { UserApplicationAccess, UserApplicationAccessNotFoundError } = require('../../../infra/models/UserApplicationAccess');
const { Application, ApplicationNotFoundError } = require('../../../infra/models/Application');
const User = require('../../../infra/models/User');
const database = require('../../../infra/db/database');

const router = express.Router();

// Apply tenant middleware to all entitlement routes (tenant-scoped)
router.use(tenantMiddleware);

// Apply authentication to all entitlement routes
router.use(requireAuth);

/**
 * @openapi
 * /entitlements:
 *   get:
 *     tags: [Licenses]
 *     summary: List tenant licenses with enhanced data
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all application licenses for the current tenant with pricing snapshots and seats per user type
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
 *         name: applicationSlug
 *         schema:
 *           type: string
 *         description: Filter by specific application slug (e.g., "tq", "pm")
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
 *                           application:
 *                             type: object
 *                             properties:
 *                               id: { type: integer }
 *                               name: { type: string }
 *                               slug: { type: string }
 *                           status: { type: string }
 *                           userLimit: { type: integer, nullable: true }
 *                           seatsUsed: { type: integer }
 *                           expiresAt: { type: string, nullable: true }
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
 *             example:
 *               success: true
 *               data:
 *                 tenantId: 1
 *                 tenantName: "Acme Corp"
 *                 licenses:
 *                   - id: 1
 *                     application:
 *                       id: 1
 *                       name: "TQ - Quality Management"
 *                       slug: "tq"
 *                     status: "active"
 *                     userLimit: 50
 *                     seatsUsed: 12
 *                     expiresAt: "2025-12-31T23:59:59.000Z"
 *                     activatedAt: "2024-01-15T10:30:00.000Z"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                   - id: 2
 *                     application:
 *                       id: 2
 *                       name: "Project Manager"
 *                       slug: "pm"
 *                     status: "active"
 *                     userLimit: 25
 *                     seatsUsed: 8
 *                     expiresAt: null
 *                     activatedAt: "2024-02-01T14:20:00.000Z"
 *                     createdAt: "2024-02-01T14:20:00.000Z"
 *                     updatedAt: "2024-02-01T14:20:00.000Z"
 *                 pagination:
 *                   total: 2
 *                   limit: 50
 *                   offset: 0
 *                   hasMore: false
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
    const { includeExpired = false, status, applicationSlug, limit = 50, offset = 0 } = req.query;

    const options = {
      includeExpired: includeExpired === 'true',
      status,
      applicationSlug,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Get enhanced licenses with pricing data and seat breakdown
    const enhancedLicenses = await getEnhancedLicenses(tenantId, options);
    const totalLicenses = await TenantApplication.count(tenantId, { status, applicationSlug, includeExpired: options.includeExpired });
    
    res.json({
      success: true,
      data: {
        tenantId,
        tenantName: req.tenant.name,
        licenses: enhancedLicenses,
        pagination: {
          total: totalLicenses,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + enhancedLicenses.length < totalLicenses
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
 * Helper function to get enhanced license data
 */
async function getEnhancedLicenses(tenantId, options = {}) {
  const { status, applicationSlug, limit = 50, offset = 0, includeExpired = false } = options;

  // Simplified query based on tenant_applications table
  let query = `
    SELECT
      ta.id,
      ta.tenant_id_fk,
      ta.application_id,
      ta.status,
      ta.activated_at,
      ta.expires_at,
      ta.max_users as user_limit,
      ta.seats_used,
      ta.active,
      ta.created_at,
      ta.updated_at,
      -- Application data
      a.name as app_name,
      a.slug as app_slug,
      a.description as app_description
    FROM public.tenant_applications ta
    INNER JOIN public.applications a ON ta.application_id = a.id
    WHERE ta.tenant_id_fk = $1 AND ta.active = true
  `;

  const params = [tenantId];

  if (status) {
    query += ` AND ta.status = $${params.length + 1}`;
    params.push(status);
  }

  if (applicationSlug) {
    query += ` AND a.slug = $${params.length + 1}`;
    params.push(applicationSlug);
  }

  if (!includeExpired) {
    query += ` AND (ta.expires_at IS NULL OR ta.expires_at > NOW())`;
  }

  query += `
    ORDER BY ta.activated_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(limit, offset);

  const result = await database.query(query, params);

  return result.rows.map(row => ({
    id: row.id,
    application: {
      id: row.application_id,
      name: row.app_name,
      slug: row.app_slug,
      description: row.app_description
    },
    status: row.status,
    userLimit: row.user_limit,
    seatsUsed: row.seats_used || 0,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

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
      const query = `
        SELECT uaa.*, u.name as user_name, u.email as user_email, u.role as user_role,
               a.name as app_name, a.slug as app_slug, a.description as app_description
        FROM public.user_application_access uaa
        INNER JOIN public.users u ON uaa.user_id = u.id
        INNER JOIN public.applications a ON uaa.application_id = a.id
        WHERE uaa.tenant_id_fk = $1 AND uaa.active = true
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
