const express = require('express');
const authService = require('../../../infra/authService');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, optionalAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { validatePassword, isValidEmail } = require('../../../../shared/types/user');

const router = express.Router();

// Apply tenant middleware to all auth routes
router.use(tenantMiddleware);

// Apply rate limiting to auth routes
const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Register a new user in the current tenant context
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: securePassword123
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [operations, manager, admin]
 *                 default: operations
 *                 example: manager
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                     user: { type: object }
 *                     token: { type: string }
 *                     expiresIn: { type: string }
 *                     allowedApps: { type: array, items: { type: string } }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, and name are required'
      });
    }

    const result = await authService.register(req.tenant, {
      email,
      password,
      name,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.message.includes('already exists')) {
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
      message: 'Registration failed'
    });
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to administrative panel
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Authenticate admin user and get JWT token with tenant context
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: consultoriasimplia@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user: { type: object }
 *                     token: { type: string, description: JWT access token }
 *                     expiresIn: { type: string }
 *                     allowedApps: { type: array, items: { type: string } }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(req.tenant, {
      email,
      password
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.name === 'InvalidCredentialsError' || error.message.includes('Invalid')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    if (error.message.includes('inactive') || error.message.includes('suspended')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authRateLimit, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Token is required'
      });
    }

    const result = await authService.refreshToken(token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token refresh failed'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = require('../../../infra/middleware/auth').extractToken(req);
    
    const result = await authService.logout(token);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]  
 *     summary: Get current user profile
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get authenticated user information and permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant identifier
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId: { type: integer }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         allowedApps: 
 *                           type: array
 *                           items:
 *                             type: string
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         name: { type: string }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
        tenant: req.tenant
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
});

/**
 * PUT /auth/change-password
 * Change user password
 */
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Old password and new password are required'
      });
    }

    const result = await authService.changePassword(
      req.user.userId,
      req.tenant.tenantId,
      oldPassword,
      newPassword
    );

    res.json({
      success: true,
      message: result.message,
      data: {
        user: result.user
      }
    });
  } catch (error) {
    console.error('Change password error:', error);

    if (error.name === 'InvalidCredentialsError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect'
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
      message: 'Password change failed'
    });
  }
});

/**
 * POST /auth/validate-token
 * Validate JWT token (utility endpoint)
 */
router.post('/validate-token', optionalAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Token is required'
      });
    }

    const result = await authService.getUserFromToken(token);

    res.json({
      success: true,
      message: 'Token is valid',
      data: result
    });
  } catch (error) {
    console.error('Token validation error:', error);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
});

/**
 * GET /auth/tenant-info
 * Get current tenant information
 */
router.get('/tenant-info', optionalAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        tenant: req.tenant,
        user: req.user || null
      }
    });
  } catch (error) {
    console.error('Get tenant info error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get tenant information'
    });
  }
});

// Health check endpoint for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;