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
 *                           pricingSnapshot:
 *                             type: object
 *                             properties:
 *                               price: { type: number }
 *                               currency: { type: string }
 *                               validFrom: { type: string }
 *                               validTo: { type: string }
 *                           seatsByUserType:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 userTypeId: { type: integer }
 *                                 userType: { type: string }
 *                                 total: { type: integer }
 *                                 used: { type: integer }
 *                                 available: { type: integer }
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
    
    // Get enhanced licenses with pricing data and seat breakdown
    const enhancedLicenses = await getEnhancedLicenses(tenantId, options);
    const totalLicenses = await TenantApplication.count(tenantId, { status, includeExpired: options.includeExpired });
    
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
 * Helper function to get enhanced license data with pricing snapshots and seats by user type
 */
async function getEnhancedLicenses(tenantId, options = {}) {
  const { status, limit = 50, offset = 0, includeExpired = false } = options;
  
  // Complex query to get licenses with aggregated seat data by user type
  let query = `
    WITH license_seats AS (
      SELECT 
        ta.id as license_id,
        uaa.application_id,
        COALESCE(uaa.user_type_id_snapshot, u.user_type_id) as user_type_id,
        ut.name as user_type_name,
        ut.hierarchy_level,
        COUNT(*) as seats_used,
        -- Get representative pricing snapshot (most common price for this user type)
        MODE() WITHIN GROUP (ORDER BY uaa.price_snapshot) as modal_price,
        MODE() WITHIN GROUP (ORDER BY uaa.currency_snapshot) as modal_currency
      FROM public.tenant_applications ta
      LEFT JOIN public.user_application_access uaa 
        ON ta.application_id = uaa.application_id 
        AND ta.tenant_id_fk = uaa.tenant_id_fk 
        AND uaa.active = true
      LEFT JOIN public.users u ON uaa.user_id = u.id
      LEFT JOIN public.user_types ut ON COALESCE(uaa.user_type_id_snapshot, u.user_type_id) = ut.id
      WHERE ta.tenant_id_fk = $1 AND ta.active = true
      GROUP BY 1,2,3,4,5
    ),
    current_pricing AS (
      SELECT DISTINCT
        ap.application_id,
        ap.user_type_id,
        ap.price,
        ap.currency,
        ap.billing_cycle,
        ap.valid_from,
        ap.valid_to
      FROM public.application_pricing ap
      WHERE ap.active = true
        AND ap.valid_from <= NOW()
        AND (ap.valid_to IS NULL OR ap.valid_to > NOW())
    )
    SELECT 
      ta.id,
      ta.tenant_id_fk,
      ta.application_id,
      ta.status,
      ta.activated_at,
      ta.expires_at,
      ta.max_users as user_limit,
      ta.seats_used as total_seats_used,
      ta.active,
      ta.created_at,
      ta.updated_at,
      -- Application data
      a.name as app_name,
      a.slug as app_slug,
      a.description as app_description,
      -- Aggregated seat data by user type
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'userTypeId', ls.user_type_id,
            'userType', ls.user_type_name,
            'used', COALESCE(ls.seats_used, 0),
            'total', ta.max_users,
            'available', CASE 
              WHEN ta.max_users IS NULL THEN NULL
              ELSE GREATEST(0, ta.max_users - COALESCE(ls.seats_used, 0))
            END,
            'hierarchyLevel', ls.hierarchy_level,
            'pricing', JSON_BUILD_OBJECT(
              'price', COALESCE(ls.modal_price, cp.price),
              'currency', COALESCE(ls.modal_currency, cp.currency),
              'billingCycle', cp.billing_cycle,
              'validFrom', cp.valid_from,
              'validTo', cp.valid_to
            )
          )
          ORDER BY ls.hierarchy_level NULLS LAST, ls.user_type_name
        ) FILTER (WHERE ls.user_type_id IS NOT NULL),
        '[]'::json
      ) as seats_by_user_type
    FROM public.tenant_applications ta
    INNER JOIN public.applications a ON ta.application_id = a.id
    LEFT JOIN license_seats ls ON ta.id = ls.license_id
    LEFT JOIN current_pricing cp ON a.id = cp.application_id AND ls.user_type_id = cp.user_type_id
    WHERE ta.tenant_id_fk = $1 AND ta.active = true
  `;
  
  const params = [tenantId];
  
  if (status) {
    query += ` AND ta.status = $${params.length + 1}`;
    params.push(status);
  }
  
  if (!includeExpired) {
    query += ` AND (ta.expires_at IS NULL OR ta.expires_at > NOW())`;
  }
  
  query += `
    GROUP BY ta.id, ta.tenant_id_fk, ta.application_id, ta.status, ta.activated_at, 
             ta.expires_at, ta.max_users, ta.seats_used, ta.active, ta.created_at, 
             ta.updated_at, a.name, a.slug, a.description
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
    pricingSnapshot: getPricingSnapshot(row.seats_by_user_type),
    seatsByUserType: row.seats_by_user_type || [],
    expiryDate: row.expires_at,
    activatedAt: row.activated_at,
    userLimit: row.user_limit,
    totalSeatsUsed: row.total_seats_used || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/**
 * Extract representative pricing snapshot from seats data
 */
function getPricingSnapshot(seatsByUserType) {
  if (!seatsByUserType || seatsByUserType.length === 0) {
    return null;
  }
  
  // Find the user type with the most seats or the highest hierarchy level
  const representative = seatsByUserType.reduce((prev, current) => {
    if (!prev) return current;
    if (current.used > prev.used) return current;
    if (current.used === prev.used && current.hierarchyLevel < prev.hierarchyLevel) return current;
    return prev;
  }, null);
  
  return representative ? representative.pricing : null;
}

/**
 * @openapi
 * /entitlements/{applicationSlug}:
 *   get:
 *     tags: [Licenses]
 *     summary: Get specific license details
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get detailed information about a specific application license for the tenant
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
      limit: licenseInfo.max_users || 0,
      available: (licenseInfo.max_users || 0) - (licenseInfo.seats_used || 0),
      percentage: licenseInfo.max_users ? 
        Math.round(((licenseInfo.seats_used || 0) / licenseInfo.max_users) * 100) : 0
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
