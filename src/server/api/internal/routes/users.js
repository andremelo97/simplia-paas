const express = require('express');
const userService = require('../../../infra/userService');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { 
  requireAuth, 
  requireAdmin, 
  requireManagerOrAdmin, 
  requireSelfOrAdmin,
  createRateLimit 
} = require('../../../infra/middleware/auth');
const { UserApplicationAccess } = require('../../../infra/models/UserApplicationAccess');
const { Application } = require('../../../infra/models/Application');
const ApplicationPricing = require('../../../infra/models/ApplicationPricing');
const { TenantApplication } = require('../../../infra/models/TenantApplication');

const router = express.Router();

// Apply tenant middleware to all user routes
router.use(tenantMiddleware);

// Apply authentication to all user routes
router.use(requireAuth);

// Apply rate limiting
const userRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
router.use(userRateLimit);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users in tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all users belonging to the current tenant with filtering and pagination
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
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [operations, manager, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           default: active
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           email: { type: string }
 *                           name: { type: string }
 *                           role: { type: string }
 *                           status: { type: string }
 *                           allowedApps: { type: array, items: { type: string } }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
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
    const { page = 1, limit = 20, role, status = 'active' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const options = {
      limit: parseInt(limit),
      offset,
      role: role || undefined,
      status
    };

    const users = await userService.getUsers(req.tenant, req.user, options);
    const totalUsers = await userService.getUserCount(req.tenant, { role, status });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers,
          hasMore: offset + users.length < totalUsers
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: {
          code: 403,
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get users'
      }
    });
  }
});


module.exports = router;