const express = require('express');
const authService = require('../../../infra/authService');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const PlatformLoginAudit = require('../../../infra/models/PlatformLoginAudit');

const router = express.Router();

// Apply rate limiting to auth routes (configurable via ENV)
const maxRequests = parseInt(process.env.PLATFORM_LOGIN_MAX || '10');
const windowMs = parseInt(process.env.PLATFORM_LOGIN_WINDOW_MS || '900000'); // 15 minutes default
const authRateLimit = createRateLimit(windowMs, maxRequests);

/**
 * @openapi
 * /platform-auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Platform admin login (LivoCare team)
 *     description: |
 *       Login for LivoCare internal team members with platform_role = 'internal_admin'.
 *       This login doesn't require tenant context as it's for platform administration.
 *
 *       **Rate Limiting:** Configurable via ENV variables:
 *       - PLATFORM_LOGIN_MAX (default: 10)
 *       - PLATFORM_LOGIN_WINDOW_MS (default: 900000 = 15 minutes)
 *
 *       **Side Effects:**
 *       - Updates users.last_login timestamp
 *       - Creates audit log entry in platform_login_audit table
 *
 *       **Security Features:**
 *       - All attempts (success/failure) are logged with IP, User-Agent
 *       - Rate limiting prevents brute force attacks
 *       - Standardized error codes for monitoring
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
 *                 example: admin@livocare.ai
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "LOGIN_SUCCESS" }
 *                     message: { type: string, example: "Signed in successfully." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId: { type: integer }
 *                         email: { type: string }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *                         name: { type: string }
 *                         platformRole: { type: string, example: "internal_admin" }
 *                         active: { type: boolean }
 *                         createdAt: { type: string, format: date-time }
 *                     token: { type: string, description: "JWT access token" }
 *                     expiresIn: { type: string, example: "24h" }
 *       400:
 *         description: Missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string, example: "Validation Error" }
 *                 message: { type: string, example: "Email and password are required" }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "LOGIN_MISSING_CREDENTIALS" }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string, example: "Unauthorized" }
 *                 message: { type: string, example: "Invalid email or password" }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "INVALID_CREDENTIALS" }
 *       403:
 *         description: Insufficient privileges or account inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string, example: "Forbidden" }
 *                 message: { type: string, example: "Insufficient platform privileges" }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, enum: ["PLATFORM_ROLE_REQUIRED", "ACCOUNT_INACTIVE"] }
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string, example: "Too Many Requests" }
 *                 message: { type: string, example: "Rate limit exceeded" }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "RATE_LIMITED" }
 */
router.post('/login', authRateLimit, async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  try {
    // Basic validation
    if (!email || !password) {
      await PlatformLoginAudit.logAttempt({
        email: email || 'unknown',
        ipAddress,
        userAgent,
        success: false,
        reason: 'missing_credentials'
      });

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required',
        meta: { code: 'LOGIN_MISSING_CREDENTIALS' }
      });
    }

    const result = await authService.platformLogin({
      email,
      password
    });

    // Log successful login
    await PlatformLoginAudit.logAttempt({
      userIdFk: result.user.userId,
      email,
      ipAddress,
      userAgent,
      success: true,
      reason: 'login_success'
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

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let reason = 'internal_error';
    let message = 'Platform login failed';

    if (error.name === 'InvalidCredentialsError' || error.message.includes('Invalid')) {
      statusCode = 401;
      errorCode = 'INVALID_CREDENTIALS';
      reason = 'invalid_credentials';
      message = 'Invalid email or password';
    } else if (error.message.includes('platform_role') || error.message.includes('internal_admin')) {
      statusCode = 403;
      errorCode = 'PLATFORM_ROLE_REQUIRED';
      reason = 'platform_role_required';
      message = 'Insufficient platform privileges';
    } else if (error.message.includes('inactive') || error.message.includes('suspended')) {
      statusCode = 403;
      errorCode = 'ACCOUNT_INACTIVE';
      reason = 'account_inactive';
      message = error.message;
    }

    // Log failed login attempt
    await PlatformLoginAudit.logAttempt({
      email,
      ipAddress,
      userAgent,
      success: false,
      reason
    });

    res.status(statusCode).json({
      success: false,
      error: statusCode === 401 ? 'Unauthorized' : statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
      message,
      meta: { code: errorCode }
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

/**
 * @openapi
 * /platform-auth/audit:
 *   get:
 *     tags: [Auth]
 *     summary: Get platform login audit logs
 *     description: |
 *       Retrieve audit logs for platform login attempts.
 *       Only accessible by platform admins for security monitoring.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of records to return
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status (true/false)
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           userIdFk: { type: integer, nullable: true }
 *                           email: { type: string }
 *                           ipAddress: { type: string, nullable: true }
 *                           userAgent: { type: string, nullable: true }
 *                           success: { type: boolean }
 *                           reason: { type: string, nullable: true }
 *                           createdAt: { type: string, format: date-time }
 *                     total: { type: integer }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/audit', requireAuth, async (req, res) => {
  try {
    // Verify platform role
    if (!req.user.platformRole || req.user.platformRole !== 'internal_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient platform privileges'
      });
    }

    const { email, limit = 50, success } = req.query;
    const limitNum = Math.min(parseInt(limit) || 50, 100);

    let query = `
      SELECT id, user_id_fk, email, ip_address, user_agent, success, reason, created_at
      FROM platform_login_audit
      WHERE 1=1
    `;
    const params = [];

    if (email) {
      query += ` AND email ILIKE $${params.length + 1}`;
      params.push(`%${email}%`);
    }

    if (success !== undefined) {
      query += ` AND success = $${params.length + 1}`;
      params.push(success === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limitNum);

    const database = require('../../../infra/db/database');
    const result = await database.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM platform_login_audit
      WHERE 1=1
    `;
    const countParams = [];

    if (email) {
      countQuery += ` AND email ILIKE $${countParams.length + 1}`;
      countParams.push(`%${email}%`);
    }

    if (success !== undefined) {
      countQuery += ` AND success = $${countParams.length + 1}`;
      countParams.push(success === 'true');
    }

    const countResult = await database.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        logs: result.rows.map(row => ({
          id: row.id,
          userIdFk: row.user_id_fk,
          email: row.email,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          success: row.success,
          reason: row.reason,
          createdAt: row.created_at
        })),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Get platform audit logs error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get audit logs'
    });
  }
});

module.exports = router;