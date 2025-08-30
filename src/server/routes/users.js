const express = require('express');
const userService = require('../services/userService');
const tenantMiddleware = require('../middleware/tenant');
const { 
  requireAuth, 
  requireAdmin, 
  requireDoctorOrAdmin, 
  requireSelfOrAdmin,
  createRateLimit 
} = require('../middleware/auth');

const router = express.Router();

// Apply tenant middleware to all user routes
router.use(tenantMiddleware);

// Apply authentication to all user routes
router.use(requireAuth);

// Apply rate limiting
const userRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
router.use(userRateLimit);

/**
 * GET /users
 * Get all users in tenant
 */
router.get('/', requireDoctorOrAdmin, async (req, res) => {
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

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length // In production, you'd get total count separately
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get users'
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
 * GET /users/role/:role
 * Get users by role
 */
router.get('/role/:role', requireDoctorOrAdmin, async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const options = {
      limit: parseInt(limit),
      offset
    };

    const users = await userService.getUsersByRole(req.tenant, req.user, role, options);

    res.json({
      success: true,
      data: {
        role,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length
        }
      }
    });
  } catch (error) {
    console.error('Get users by role error:', error);

    if (error.name === 'InsufficientPermissionsError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    if (error.message.includes('Invalid role')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get users by role'
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

    const user = await userService.getUserById(req.tenant, req.user, userId);

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
 * PUT /users/bulk-update
 * Bulk update users
 */
router.put('/bulk-update', requireAdmin, async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userIds must be a non-empty array'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'updates object is required'
      });
    }

    const results = await userService.bulkUpdateUsers(req.tenant, req.user, userIds, updates);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    console.error('Bulk update users error:', error);

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
      message: 'Bulk update failed'
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