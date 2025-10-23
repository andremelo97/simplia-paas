const express = require('express');
const bcrypt = require('bcrypt');
const authService = require('../../../infra/authService');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, optionalAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { validatePassword, isValidEmail } = require('../../../../shared/types/user');
const db = require('../../../infra/db/database');
const User = require('../../../infra/models/User');

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
      meta: {
        code: "LOGIN_SUCCESS",
        message: "Signed in successfully."
      },
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
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change user password
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Allows authenticated user to change their own password.
 *       Requires current password for verification.
 *       After successful password change, user must login again.
 *     security:
 *       - bearerAuth: []
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
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: 'PASSWORD_CHANGED' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: integer }
 *                     changedAt: { type: string }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid current password or authentication required
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;
    const tenantId = req.tenant?.id;

    // Validate request
    if (!userId || !tenantId) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Authentication required'
        }
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Current password and new password are required'
        }
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'New password must be at least 6 characters long'
        }
      });
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'New password must be different from current password'
        }
      });
    }

    // Fetch user with password hash
    const user = await User.findById(userId, tenantId);

    if (!user) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'User not found'
        }
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'The current password you entered is incorrect'
        }
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.updatePassword(newPasswordHash);

    res.json({
      success: true,
      meta: {
        code: 'PASSWORD_CHANGED'
      },
      data: {
        userId: user.id,
        changedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Change password error:', error);

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to change password'
      }
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


module.exports = router;