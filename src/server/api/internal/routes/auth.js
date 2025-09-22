const express = require('express');
const authService = require('../../../infra/authService');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, optionalAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { validatePassword, isValidEmail } = require('../../../../shared/types/user');
const db = require('../../../infra/db/database');

const router = express.Router();

// Apply tenant middleware to all auth routes
router.use(tenantMiddleware);

// Apply rate limiting to auth routes
const authRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh tenant user token
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Refresh JWT token for tenant user session. Same functionality as platform-auth/refresh
 *       but for tenant-scoped users.
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
    console.error('Token refresh error:', error);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token refresh failed'
    });
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate tenant user
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Authenticate user within a specific tenant context.
 *       Requires tenant to be resolved via x-tenant-id header.
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
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Authentication successful
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
 *                     user: { $ref: '#/components/schemas/User' }
 *                     token: { type: string }
 *                     expiresIn: { type: string }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    // Get tenant context from middleware
    const tenantContext = {
      id: req.tenant?.id,
      tenantId: req.tenant?.id,
      slug: req.tenant?.slug,
      schema: req.tenant?.schema
    };

    const result = await authService.login(tenantContext, {
      email,
      password
    });

    res.json({
      success: true,
      message: 'Authentication successful',
      data: result
    });
  } catch (error) {
    console.error('Tenant login error:', error);

    let statusCode = 500;
    let message = 'Authentication failed';

    if (error.name === 'InvalidCredentialsError' || error.message.includes('Invalid')) {
      statusCode = 401;
      message = 'Invalid email or password';
    }

    res.status(statusCode).json({
      error: 'Authentication Error',
      message: message
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
 *     summary: Get current user profile with accessible apps
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get authenticated user information, tenant details, and applications the user can access.
 *       This endpoint consolidates user profile and app access information for the Hub.
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
 *         description: User profile and apps retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     email: { type: string }
 *                     role: { type: string }
 *                     allowedApps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           slug: { type: string }
 *                           name: { type: string }
 *                           roleInApp: { type: string }
 *                           expiresAt: { type: string, nullable: true }
 *                           licenseStatus: { type: string }
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         name: { type: string }
 *                         slug: { type: string }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.tenant?.id;

    if (!userId || !tenantId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing user or tenant context'
      });
    }

    // Get user's accessible apps (same query as /me/apps)
    const { rows: allowedApps } = await db.query(
      `SELECT a.slug,
              a.name,
              uaa.role_in_app   AS "roleInApp",
              uaa.expires_at    AS "expiresAt",
              ta.status         AS "licenseStatus"
         FROM public.user_application_access uaa
         JOIN public.applications a
           ON a.id = uaa.application_id_fk
         JOIN public.tenant_applications ta
           ON ta.application_id_fk = uaa.application_id_fk
          AND ta.tenant_id_fk   = uaa.tenant_id_fk
        WHERE uaa.tenant_id_fk  = $1
          AND uaa.user_id_fk    = $2
          AND uaa.active = true
          AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())
          AND ta.active = true
        ORDER BY a.name`,
      [tenantId, userId]
    );

    res.json({
      success: true,
      data: {
        email: req.user.email,
        role: req.user.role,
        allowedApps,
        tenant: {
          name: req.tenant.name,
          slug: req.tenant.slug
        }
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