const express = require('express');
const authService = require('../../../infra/authService');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');

const router = express.Router();

// Apply rate limiting to auth routes
const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes

/**
 * @openapi
 * /platform-auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Platform admin login (Simplia team)
 *     description: |
 *       Login for Simplia internal team members with platform_role = 'internal_admin'.
 *       This login doesn't require tenant context as it's for platform administration.
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
 *         description: Platform login successful
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
 *                     user: 
 *                       type: object
 *                       properties:
 *                         userId: { type: integer }
 *                         email: { type: string }
 *                         name: { type: string }
 *                         platformRole: { type: string }
 *                     token: { type: string, description: JWT access token }
 *                     expiresIn: { type: string }
 *       401:
 *         description: Invalid credentials or not a platform admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Account inactive or insufficient platform privileges
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

    const result = await authService.platformLogin({
      email,
      password
    });

    res.json({
      meta: {
        code: "LOGIN_SUCCESS",
        message: "Signed in successfully."
      },
      data: result
    });
  } catch (error) {
    console.error('Platform login error:', error);

    if (error.name === 'InvalidCredentialsError' || error.message.includes('Invalid')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    if (error.message.includes('platform_role') || error.message.includes('internal_admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient platform privileges'
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
      message: 'Platform login failed'
    });
  }
});

/**
 * @openapi
 * /platform-auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current platform admin profile
 *     description: Get authenticated platform admin information and privileges
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform admin profile retrieved
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
 *                         name: { type: string }
 *                         platformRole: { type: string }
 *                         active: { type: boolean }
 *                         createdAt: { type: string }
 *                     platformPrivileges:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['tenant_management', 'user_management', 'license_management', 'audit_access']
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient platform privileges
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Verify user has platform role
    if (!req.user.platformRole || req.user.platformRole !== 'internal_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient platform privileges'
      });
    }

    // Define platform privileges based on internal_admin role
    const platformPrivileges = [
      'tenant_management',
      'user_management', 
      'license_management',
      'audit_access',
      'application_management',
      'system_monitoring'
    ];

    res.json({
      success: true,
      data: {
        user: {
          userId: req.user.userId,
          email: req.user.email,
          name: req.user.name,
          platformRole: req.user.platformRole,
          active: req.user.active,
          createdAt: req.user.createdAt
        },
        platformPrivileges
      }
    });
  } catch (error) {
    console.error('Get platform profile error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get platform admin profile'
    });
  }
});

/**
 * @openapi
 * /platform-auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh platform admin token
 *     description: Refresh JWT token for platform admin session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Current JWT token to refresh
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     token: { type: string }
 *                     expiresIn: { type: string }
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    console.error('Platform token refresh error:', error);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token refresh failed'
    });
  }
});

/**
 * @openapi
 * /platform-auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout platform admin
 *     description: Logout platform admin and invalidate session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    console.error('Platform logout error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Platform logout failed'
    });
  }
});

module.exports = router;