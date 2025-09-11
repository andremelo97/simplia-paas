const router = require('express').Router();
const db = require('../../../infra/db/database');

/**
 * @swagger
 * tags:
 *   - name: tenant
 *     description: Tenant-scoped routes (Hub/Apps). Requires x-tenant-id.
 */

/**
 * @swagger
 * /internal/api/v1/me/apps:
 *   get:
 *     tags: [tenant]
 *     summary: List applications the current user can access (self-service)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema: { type: integer, example: 5 }
 *         description: Numeric tenant id
 *     responses:
 *       200:
 *         description: Successful response with the user's accessible apps
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/apps', async (req, res, next) => {
  try {
    // IMPORTANT: do NOT wrap in withTenant / do NOT set search_path here.
    const userId = req.user?.userId;
    const tenantId = req.tenant?.id;

    if (!userId || !tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Missing user or tenant context' }
      });
    }

    const { rows } = await db.query(
      `SELECT a.id,
              a.slug,
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

    return res.status(200).json({
      success: true,
      meta: { code: 'MY_APPS_LISTED', message: 'Applications listed successfully.' },
      data: { apps: rows }
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router; 
