const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const db = require('../../../infra/db/database');

const router = express.Router();

// Apply tenant middleware to all entitlements routes
router.use(tenantMiddleware);

// Apply authentication to all entitlements routes
router.use(requireAuth);

// Apply rate limiting
const entitlementsRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
router.use(entitlementsRateLimit);

/**
 * @openapi
 * /entitlements:
 *   get:
 *     tags: [Licenses]
 *     summary: Get tenant licenses and entitlements
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all active licenses and user entitlements for the current tenant.
 *       Returns application licenses with user access details and usage summary.
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
 *     responses:
 *       200:
 *         description: Entitlements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     licenses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           applicationId: { type: integer }
 *                           slug: { type: string }
 *                           name: { type: string }
 *                           status: { type: string, enum: [active, suspended, expired] }
 *                           activatedAt: { type: string }
 *                           userLimit: { type: integer, nullable: true }
 *                           seatsUsed: { type: integer }
 *                           users:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 email: { type: string }
 *                                 role: { type: string, enum: [operations, manager, admin] }
 *                                 grantedAt: { type: string }
 *                     summary:
 *                       type: object
 *                       properties:
 *                         apps: { type: integer }
 *                         seatsUsed: { type: integer }
 *                         seatsLimit: { type: integer, nullable: true }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *       400:
 *         description: Missing or invalid tenant header
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Missing tenant context'
        }
      });
    }

    // Get active tenant applications with licenses
    // status is computed: 'expired' if expires_at < NOW(), otherwise ta.status
    const { rows: licenses } = await db.query(
      `SELECT ta.application_id_fk AS "applicationId",
              a.slug,
              a.name,
              CASE
                WHEN ta.expires_at IS NOT NULL AND ta.expires_at < NOW() THEN 'expired'
                ELSE ta.status
              END AS status,
              ta.activated_at AS "activatedAt",
              ta.seats_used AS "seatsUsed",
              ta.seats_purchased AS "seatsPurchased",
              ta.expires_at AS "expiresAt"
       FROM public.tenant_applications ta
       INNER JOIN public.applications a ON a.id = ta.application_id_fk
       WHERE ta.tenant_id_fk = $1
         AND ta.active = true
       ORDER BY a.name`,
      [tenantId]
    );

    // Get users for each application
    const licenseData = [];
    let totalSeatsUsed = 0;
    let totalSeatsLimit = null;

    for (const license of licenses) {
      // Get users with access to this application
      const { rows: users } = await db.query(
        `SELECT u.email,
                u.first_name AS "firstName",
                u.last_name AS "lastName",
                uaa.role_in_app AS role,
                uaa.created_at AS "grantedAt"
         FROM public.user_application_access uaa
         JOIN public.users u ON u.id = uaa.user_id_fk
         WHERE uaa.tenant_id_fk = $1
           AND uaa.application_id_fk = $2
           AND uaa.active = true
           AND (uaa.expires_at IS NULL OR uaa.expires_at > NOW())
         ORDER BY u.email`,
        [tenantId, license.applicationId]
      );

      // Use actual user count as seats used (more accurate)
      const actualSeatsUsed = users.length;

      licenseData.push({
        applicationId: license.applicationId,
        slug: license.slug,
        name: license.name,
        status: license.status,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        seatsUsed: actualSeatsUsed,
        seatsPurchased: license.seatsPurchased,
        users: users
      });

      totalSeatsUsed += actualSeatsUsed;
    }

    const summary = {
      apps: licenses.length,
      seatsUsed: totalSeatsUsed,
      seatsLimit: null
    };

    res.json({
      data: {
        licenses: licenseData,
        summary
      },
      meta: {
        code: 'ENTITLEMENTS_OK'
      }
    });
  } catch (error) {
    console.error('Get entitlements error:', error);

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get entitlements'
      }
    });
  }
});

module.exports = router;