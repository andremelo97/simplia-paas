const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../../../infra/models/User');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');

const router = express.Router();

// Apply authentication and platform role to all tenant-user routes
router.use(requireAuth);
router.use(requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /tenants/{tenantId}/users:
 *   get:
 *     tags: [Tenant Users (Internal Admin)]
 *     summary: List users in specific tenant
 *     description: Get all users belonging to a specific tenant (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           default: active
 *         description: Filter by user status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [operations, manager, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of users to skip
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
 *                           firstName: { type: string }
 *                           lastName: { type: string }
 *                           name: { type: string }
 *                           role: { type: string }
 *                           status: { type: string }
 *                           tenantIdFk: { type: integer }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     total: { type: integer }
 *       403:
 *         description: Insufficient permissions (internal_admin required)
 *       404:
 *         description: Tenant not found
 */
router.get('/:tenantId/users', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { search, status = 'active', role, limit = 50, offset = 0 } = req.query;

    const options = {
      search,
      status,
      role,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const users = await User.findByTenant(parseInt(tenantId), options);
    const total = await User.countByTenant(parseInt(tenantId), status);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        total,
        tenantId: parseInt(tenantId)
      }
    });
  } catch (error) {
    console.error('Get tenant users error:', error);

    if (error.message.includes('tenant')) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Tenant not found'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get tenant users'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users:
 *   post:
 *     tags: [Tenant Users (Internal Admin)]
 *     summary: Create user in specific tenant
 *     description: Create a new user directly assigned to a specific tenant (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [operations, manager, admin]
 *                 default: operations
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 default: active
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: USER_CREATED }
 *                     message: { type: string, example: User created successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         email: { type: string }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *                         name: { type: string }
 *                         role: { type: string }
 *                         status: { type: string }
 *                         tenantIdFk: { type: integer }
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: User already exists
 */
router.post('/:tenantId/users', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, password, firstName, lastName, role = 'operations', status = 'active' } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Email, password, firstName, and lastName are required'
        }
      });
    }

    if (!['operations', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Role must be one of: operations, manager, admin'
        }
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get user type ID for the role
    const userTypeQuery = `SELECT id FROM user_types WHERE slug = $1`;
    const database = require('../../../infra/db/database');
    const userTypeResult = await database.query(userTypeQuery, [role]);
    
    if (userTypeResult.rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid role specified'
        }
      });
    }

    const userTypeId = userTypeResult.rows[0].id;

    const userData = {
      tenantIdFk: parseInt(tenantId),
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      status,
      userTypeId
    };

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      meta: {
        code: 'USER_CREATED',
        message: 'User created successfully'
      },
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Create tenant user error:', error);

    if (error.name === 'DuplicateUserError') {
      return res.status(409).json({
        error: {
          code: 409,
          message: error.message
        }
      });
    }

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: {
          code: 400,
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to create user'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users/{userId}:
 *   put:
 *     tags: [Tenant Users (Internal Admin)]
 *     summary: Update user in specific tenant
 *     description: Update user details within a specific tenant context (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               role:
 *                 type: string
 *                 enum: [operations, manager, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: USER_UPDATED }
 *                     message: { type: string, example: User updated successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found in tenant
 */
router.put('/:tenantId/users/:userId', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;
    const updates = req.body;

    // Find user by ID and tenant
    const user = await User.findById(parseInt(userId), parseInt(tenantId));

    // Update user
    await user.update(updates);

    res.json({
      success: true,
      meta: {
        code: 'USER_UPDATED',
        message: 'User updated successfully'
      },
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Update tenant user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found in specified tenant'
        }
      });
    }

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: {
          code: 400,
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to update user'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users/{userId}:
 *   delete:
 *     tags: [Tenant Users (Internal Admin)]
 *     summary: Deactivate user in specific tenant
 *     description: Soft delete (deactivate) a user within a specific tenant context (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: USER_DEACTIVATED }
 *                     message: { type: string, example: User deactivated successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found in tenant
 */
router.delete('/:tenantId/users/:userId', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;

    // Find user by ID and tenant
    const user = await User.findById(parseInt(userId), parseInt(tenantId));

    // Soft delete user
    await user.update({ status: 'inactive' });

    res.json({
      success: true,
      meta: {
        code: 'USER_DEACTIVATED',
        message: 'User deactivated successfully'
      },
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Delete tenant user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found in specified tenant'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to deactivate user'
      }
    });
  }
});

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users (Global - Internal Admin)]
 *     summary: List users globally with tenant filter
 *     description: Get all users across all tenants with optional tenant filtering (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by specific tenant ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of users to skip
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
 *                           firstName: { type: string }
 *                           lastName: { type: string }
 *                           name: { type: string }
 *                           role: { type: string }
 *                           status: { type: string }
 *                           tenantIdFk: { type: integer }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     totalResults: { type: integer }
 *       403:
 *         description: Insufficient permissions (internal_admin required)
 */
router.get('/users', async (req, res) => {
  try {
    const { tenantId, search, status, limit = 50, offset = 0 } = req.query;

    const options = {
      tenantId: tenantId ? parseInt(tenantId) : undefined,
      search,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const users = await User.findAll(options);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        totalResults: users.length,
        filters: {
          tenantId: options.tenantId,
          search: options.search,
          status: options.status
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get users'
      }
    });
  }
});

module.exports = router;