const express = require('express');
const router = express.Router();
const TQEmailTemplate = require('../../../infra/models/TQEmailTemplate');

/**
 * @openapi
 * /tq/configurations/email-template:
 *   get:
 *     tags:
 *       - TQ - Configurations
 *     summary: Get email template for tenant
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric tenant ID
 *     responses:
 *       200:
 *         description: Email template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     subject:
 *                       type: string
 *                     body:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: EMAIL_TEMPLATE_RETRIEVED
 *       404:
 *         description: Email template not found
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(401).json({
        error: 'Tenant schema not found',
        meta: { code: 'UNAUTHORIZED' }
      });
    }

    const template = await TQEmailTemplate.find(schema);

    if (!template) {
      return res.status(404).json({
        error: 'Email template not found',
        meta: { code: 'EMAIL_TEMPLATE_NOT_FOUND' }
      });
    }

    res.json({
      data: template.toJSON(),
      meta: { code: 'EMAIL_TEMPLATE_RETRIEVED' }
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      error: 'Failed to fetch email template',
      details: error.message,
      meta: { code: 'EMAIL_TEMPLATE_FETCH_ERROR' }
    });
  }
});

/**
 * @openapi
 * /tq/configurations/email-template:
 *   post:
 *     tags:
 *       - TQ - Configurations
 *     summary: Create or update email template
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - body
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Email subject with template variables
 *               body:
 *                 type: string
 *                 description: Email body with template variables (must contain {{PUBLIC_LINK}})
 *     responses:
 *       200:
 *         description: Email template created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     subject:
 *                       type: string
 *                     body:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: EMAIL_TEMPLATE_UPDATED
 *       400:
 *         description: Validation error (missing fields or missing {{PUBLIC_LINK}})
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req, res) => {
  try {
    const { subject, body } = req.body;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(401).json({
        error: 'Tenant schema not found',
        meta: { code: 'UNAUTHORIZED' }
      });
    }

    // Validate required fields
    if (!subject || !body) {
      return res.status(400).json({
        error: 'Missing required fields: subject, body',
        meta: { code: 'VALIDATION_ERROR' }
      });
    }

    const template = await TQEmailTemplate.upsert({ subject, body }, schema);

    res.json({
      data: template.toJSON(),
      meta: { code: 'EMAIL_TEMPLATE_UPDATED' }
    });
  } catch (error) {
    console.error('Error upserting email template:', error);

    if (error.message.includes('$PUBLIC_LINK$') || error.message.includes('$PASSWORD_BLOCK$')) {
      return res.status(400).json({
        error: error.message,
        meta: { code: 'VALIDATION_ERROR' }
      });
    }

    res.status(500).json({
      error: 'Failed to update email template',
      details: error.message,
      meta: { code: 'EMAIL_TEMPLATE_UPDATE_ERROR' }
    });
  }
});

/**
 * @openapi
 * /tq/configurations/email-template/reset:
 *   post:
 *     tags:
 *       - TQ - Configurations
 *     summary: Reset email template to default values based on tenant locale
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric tenant ID
 *     responses:
 *       200:
 *         description: Email template reset to defaults successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: EMAIL_TEMPLATE_RESET
 *       401:
 *         description: Unauthorized
 */
router.post('/reset', async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(401).json({
        error: 'Tenant schema not found',
        meta: { code: 'UNAUTHORIZED' }
      });
    }

    // Get tenant timezone to determine locale
    const { getLocaleFromTimezone } = require('../../../infra/utils/localeMapping');
    const { Tenant } = require('../../../infra/models/Tenant');

    const tenant = await Tenant.findById(req.tenant.id);
    const locale = getLocaleFromTimezone(tenant.timezone);

    const defaults = TQEmailTemplate.getDefaultTemplate(locale);
    const template = await TQEmailTemplate.upsert(defaults, schema);

    res.json({
      data: template.toJSON(),
      meta: { code: 'EMAIL_TEMPLATE_RESET' }
    });
  } catch (error) {
    console.error('Error resetting email template:', error);
    res.status(500).json({
      error: 'Failed to reset email template',
      details: error.message,
      meta: { code: 'EMAIL_TEMPLATE_RESET_ERROR' }
    });
  }
});

module.exports = router;
