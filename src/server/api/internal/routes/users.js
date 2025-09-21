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

/**
 * GET /users/stats
 * Get tenant user statistics
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await userService.getTenantStats(req.tenant, req.user);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user statistics'
    });
  }
});

/**
 * POST /users
 * Create new user
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, and name are required'
      });
    }

    const user = await userService.createUser(req.tenant, req.user, {
      email,
      password,
      name,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    if (error.name === 'DuplicateUserError') {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    });
  }
});

/**
 * GET /users/:userId
 * Get user by ID
 */
router.get('/:userId', requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userService.getUserById(req.tenant.id, req.user, userId);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user'
    });
  }
});

/**
 * PUT /users/:userId
 * Update user
 */
router.put('/:userId', requireSelfOrAdmin('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await userService.updateUser(req.tenant, req.user, userId, updates);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /users/:userId
 * Delete user (soft delete)
 */
router.delete('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userService.deleteUser(req.tenant, req.user, userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: user
    });
  } catch (error) {
    console.error('Delete user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    if (error.message.includes('Cannot delete your own account')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user'
    });
  }
});

/**
 * POST /users/:userId/reset-password
 * Reset user password (admin only)
 */
router.post('/:userId/reset-password', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'New password is required'
      });
    }

    const result = await userService.resetUserPassword(req.tenant, req.user, userId, newPassword);

    res.json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        resetBy: result.resetBy
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    if (error.message.includes('validation') || error.message.includes('Password')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Password reset failed'
    });
  }
});

/**
 * GET /users/me/profile
 * Get current user profile
 */
router.get('/me/profile', async (req, res) => {
  try {
    const user = await userService.getCurrentUserProfile(req.tenant, req.user);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user profile error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile'
    });
  }
});

/**
 * PUT /users/me/profile
 * Update current user profile
 */
router.put('/me/profile', async (req, res) => {
  try {
    const updates = req.body;

    const user = await userService.updateCurrentUserProfile(req.tenant, req.user, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update current user profile error:', error);

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * @openapi
 * /users/{userId}/apps:
 *   get:
 *     tags: [Users]
 *     summary: Get user's application access
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       List all applications a specific user has access to
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
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User app access retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: integer }
 *                     userName: { type: string }
 *                     applications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           slug: { type: string }
 *                           name: { type: string }
 *                           roleInApp: { type: string }
 *                           grantedAt: { type: string }
 *                           expiresAt: { type: string }
 *       404:
 *         description: User not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:userId/apps', requireManagerOrAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant.id; // Use numeric ID
    
    // Verify user exists in tenant
    const user = await userService.getUserById(req.tenant.id, req.user, userId);
    
    // Get user's app access
    const userAccess = await UserApplicationAccess.findByUser(
      parseInt(userId), 
      tenantId, 
      { isActive: true }
    );
    
    res.json({
      success: true,
      data: {
        userId: parseInt(userId),
        userName: user.name,
        userEmail: user.email,
        applications: userAccess.map(access => ({
          slug: access.applicationSlug,
          name: access.applicationName,
          roleInApp: access.roleInApp,
          grantedAt: access.grantedAt,
          expiresAt: access.expiresAt,
          isActive: access.isActive
        }))
      }
    });
  } catch (error) {
    console.error('Get user apps error:', error);
    
    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }
    
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
        message: 'Failed to get user applications'
      }
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Users service is healthy',
    timestamp: new Date().toISOString(),
    tenant: req.tenant.tenantId,
    user: req.user.email
  });
});

module.exports = router;