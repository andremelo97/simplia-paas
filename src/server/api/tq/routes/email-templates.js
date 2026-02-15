const express = require('express');
const router = express.Router();
const TQEmailTemplate = require('../../../infra/models/TQEmailTemplate');
const { TenantBranding } = require('../../../infra/models/TenantBranding');
const { renderPreview } = require('../../../services/emailTemplateRenderer');
const { getLocaleFromTimezone } = require('../../../infra/utils/localeMapping');
const { Tenant } = require('../../../infra/models/Tenant');

/**
 * @openapi
 * /tq/configurations/email-template:
 *   get:
 *     tags:
 *       - TQ - Configurations
 *     summary: Get email template for tenant (includes branding data for preview)
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
 *       404:
 *         description: Email template not found
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const tenantId = req.tenant?.id;

    if (!schema) {
      return res.status(401).json({
        error: 'Tenant schema not found',
        meta: { code: 'UNAUTHORIZED' }
      });
    }

    // Get branding for preview generation (with signed URLs)
    const branding = await TenantBranding.findByTenantId(tenantId);

    // Get tenant locale and subdomain
    const tenant = await Tenant.findById(tenantId);
    const locale = getLocaleFromTimezone(tenant.timezone);

    const templateType = req.query.type || 'quote';
    let template = await TQEmailTemplate.findByType(schema, templateType);

    // Auto-seed template if not found (for existing tenants or new types)
    if (!template) {
      const defaults = TQEmailTemplate.getDefaultTemplate(locale, templateType);
      const defaultSettings = TQEmailTemplate.getDefaultSettings(locale, templateType);
      template = await TQEmailTemplate.upsert({ ...defaults, settings: defaultSettings }, schema, templateType);
    }

    res.json({
      data: {
        ...template.toJSON(),
        branding: await branding.toJSONWithSignedUrls(tenant.subdomain),
        locale
      },
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
 *     summary: Create or update email template (subject, body, and settings)
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
 *               body:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   greeting:
 *                     type: string
 *                   ctaButtonText:
 *                     type: string
 *                   footerText:
 *                     type: string
 *                   showLogo:
 *                     type: boolean
 *                   showSocialLinks:
 *                     type: boolean
 *                   showAddress:
 *                     type: boolean
 *                   showPhone:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Email template created/updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req, res) => {
  try {
    const { subject, body, settings } = req.body;
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

    const templateType = req.query.type || 'quote';
    const template = await TQEmailTemplate.upsert({ subject, body, settings }, schema, templateType);

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
    const tenant = await Tenant.findById(req.tenant.id);
    const locale = getLocaleFromTimezone(tenant.timezone);

    const templateType = req.query.type || 'quote';
    const defaults = TQEmailTemplate.getDefaultTemplate(locale, templateType);
    const defaultSettings = TQEmailTemplate.getDefaultSettings(locale, templateType);

    const template = await TQEmailTemplate.upsert({
      ...defaults,
      settings: defaultSettings
    }, schema, templateType);

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

/**
 * @openapi
 * /tq/configurations/email-template/preview:
 *   post:
 *     tags:
 *       - TQ - Configurations
 *     summary: Generate preview HTML for email template
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
 *             properties:
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preview HTML generated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/preview', async (req, res) => {
  try {
    const { subject, body, settings } = req.body;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(401).json({
        error: 'Tenant not found',
        meta: { code: 'UNAUTHORIZED' }
      });
    }

    // Get branding data (with signed URLs)
    const branding = await TenantBranding.findByTenantId(tenantId);

    // Get tenant locale and subdomain
    const tenant = await Tenant.findById(tenantId);
    const locale = getLocaleFromTimezone(tenant.timezone);

    // Generate preview
    const preview = renderPreview({
      template: { subject, body, settings },
      branding: await branding.toJSONWithSignedUrls(tenant.subdomain),
      locale
    });

    // Note: No meta.code here to avoid triggering feedback toast on every preview update
    res.json({
      data: {
        subject: preview.subject,
        html: preview.html
      }
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    res.status(500).json({
      error: 'Failed to generate email preview',
      details: error.message,
      meta: { code: 'EMAIL_PREVIEW_ERROR' }
    });
  }
});

module.exports = router;
