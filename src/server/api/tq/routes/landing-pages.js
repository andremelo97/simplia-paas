const express = require('express');
const database = require('../../../infra/db/database');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { LandingPage, LandingPageNotFoundError } = require('../../../infra/models/LandingPage');
const { Quote, QuoteNotFoundError } = require('../../../infra/models/Quote');
const { Prevention, PreventionNotFoundError } = require('../../../infra/models/Prevention');
const { createContentPackage } = require('../../../services/puckTemplateResolver');
const { getLocaleFromTimezone } = require('../../../infra/utils/localeMapping');

const router = express.Router();

// Apply tenant middleware to all TQ routes
router.use(tenantMiddleware);

// Apply authentication to all TQ routes
router.use(requireAuth);

// Apply rate limiting
const tqRateLimit = createRateLimit(15 * 60 * 1000, 200); // 200 requests per 15 minutes
router.use(tqRateLimit);

/**
 * @openapi
 * /tq/landing-pages:
 *   get:
 *     tags: [TQ - Landing Pages]
 *     summary: List all landing pages for tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Returns all landing page links for the current tenant with document and patient details.
 *       Supports filtering by active status, document type, and created date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *       - in: query
 *         name: active
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true for active, false for inactive)
 *       - in: query
 *         name: document_type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [quote, prevention]
 *         description: Filter by document type
 *       - in: query
 *         name: created_from
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by created date (from)
 *       - in: query
 *         name: created_to
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by created date (to)
 *     responses:
 *       200:
 *         description: List of landing pages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    // Extract query parameters for filtering
    const { active, document_type, created_from, created_to } = req.query;

    // Build WHERE conditions
    const conditions = ['lp.tenant_id = $1'];
    const params = [req.tenant.id];
    let paramIndex = 2;

    // Filter by active status
    if (active !== undefined) {
      conditions.push(`lp.active = $${paramIndex}`);
      params.push(active === 'true');
      paramIndex++;
    }

    // Filter by document type
    if (document_type) {
      conditions.push(`lp.document_type = $${paramIndex}`);
      params.push(document_type);
      paramIndex++;
    }

    // Filter by created_at range (accepts ISO timestamp UTC from frontend)
    if (created_from) {
      conditions.push(`lp.created_at >= $${paramIndex}::timestamptz`);
      params.push(created_from);
      paramIndex++;
    }

    if (created_to) {
      conditions.push(`lp.created_at <= $${paramIndex}::timestamptz`);
      params.push(created_to);
      paramIndex++;
    }

    // Get all landing pages for this tenant with joined data
    // Uses LEFT JOIN to handle both quote and prevention document types
    const query = `
      SELECT
        lp.*,
        q.number as quote_number,
        q.total as quote_total,
        q.status as quote_status,
        q.session_id as quote_session_id,
        prv.number as prevention_number,
        prv.status as prevention_status,
        prv.session_id as prevention_session_id,
        COALESCE(sq.patient_id, sprv.patient_id) as session_patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        lpt.name as template_name
      FROM ${schema}.landing_page lp
      LEFT JOIN ${schema}.quote q ON lp.document_id = q.id AND lp.document_type = 'quote'
      LEFT JOIN ${schema}.session sq ON q.session_id = sq.id
      LEFT JOIN ${schema}.prevention prv ON lp.document_id = prv.id AND lp.document_type = 'prevention'
      LEFT JOIN ${schema}.session sprv ON prv.session_id = sprv.id
      LEFT JOIN ${schema}.patient p ON COALESCE(sq.patient_id, sprv.patient_id) = p.id
      LEFT JOIN ${schema}.landing_page_template lpt ON lp.template_id = lpt.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY lp.created_at DESC
    `;

    const result = await database.query(query, params);
    const landingPages = result.rows.map(row => new LandingPage(row));

    res.json({
      data: landingPages.map(lp => lp.toJSON())
    });
  } catch (error) {
    console.error('List landing pages error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list landing pages'
    });
  }
});

/**
 * @openapi
 * /tq/landing-pages:
 *   post:
 *     tags: [TQ - Landing Pages]
 *     summary: Create landing page link
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Creates a shareable landing page link for a quote or prevention document.
 *       Password will be auto-generated and sent to patient's email.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *               - documentType
 *             properties:
 *               documentId:
 *                 type: string
 *                 format: uuid
 *               documentType:
 *                 type: string
 *                 enum: [quote, prevention]
 *                 default: quote
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Landing page template ID to use for rendering. If not provided, default template will be used.
 *                 nullable: true
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the landing page link
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Landing page link created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Document not found
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { documentId, documentType = 'quote', templateId, expiresAt, tenantId, autoGeneratePassword = true } = req.body;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    if (!documentId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'documentId is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'tenantId is required'
      });
    }

    if (!['quote', 'prevention'].includes(documentType)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'documentType must be "quote" or "prevention"'
      });
    }

    let documentData;
    let patientData;
    let itemsResult = { rows: [] };

    if (documentType === 'quote') {
      // Fetch quote with patient data
      const quoteQuery = `
        SELECT
          q.*,
          s.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.email as patient_email,
          p.phone as patient_phone
        FROM ${schema}.quote q
        INNER JOIN ${schema}.session s ON q.session_id = s.id
        INNER JOIN ${schema}.patient p ON s.patient_id = p.id
        WHERE q.id = $1
      `;

      const quoteResult = await database.query(quoteQuery, [documentId]);

      if (quoteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found'
        });
      }

      documentData = quoteResult.rows[0];
      patientData = {
        first_name: documentData.patient_first_name,
        last_name: documentData.patient_last_name,
        email: documentData.patient_email,
        phone: documentData.patient_phone
      };

      // Fetch quote items
      const itemsQuery = `
        SELECT * FROM ${schema}.quote_item
        WHERE quote_id = $1
        ORDER BY created_at ASC
      `;
      itemsResult = await database.query(itemsQuery, [documentId]);
    } else {
      // Fetch prevention with patient data
      const preventionQuery = `
        SELECT
          prv.*,
          s.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.email as patient_email,
          p.phone as patient_phone
        FROM ${schema}.prevention prv
        INNER JOIN ${schema}.session s ON prv.session_id = s.id
        INNER JOIN ${schema}.patient p ON s.patient_id = p.id
        WHERE prv.id = $1
      `;

      const preventionResult = await database.query(preventionQuery, [documentId]);

      if (preventionResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Prevention document not found'
        });
      }

      documentData = preventionResult.rows[0];
      patientData = {
        first_name: documentData.patient_first_name,
        last_name: documentData.patient_last_name,
        email: documentData.patient_email,
        phone: documentData.patient_phone
      };
    }

    // Fetch template content if templateId provided
    let templateContent = null;
    if (templateId) {
      const templateQuery = `
        SELECT content FROM ${schema}.landing_page_template
        WHERE id = $1
      `;
      const templateResult = await database.query(templateQuery, [templateId]);
      if (templateResult.rows.length > 0) {
        templateContent = templateResult.rows[0].content;
      }
    }

    // Create content package with resolved data
    const locale = getLocaleFromTimezone(req.tenant?.timezone);

    const contentPackage = createContentPackage(
      templateContent,
      {
        number: documentData.number,
        total: documentData.total || 0,
        content: documentData.content,
        status: documentData.status,
        created_at: documentData.created_at
      },
      patientData,
      itemsResult.rows,
      { locale }
    );

    // Auto-generate secure password
    const crypto = require('crypto');
    const password = autoGeneratePassword
      ? crypto.randomBytes(6).toString('base64url')
      : null;

    // Generate access token and public URL
    const accessToken = LandingPage.generateAccessToken();
    const baseUrl = process.env.TQ_ORIGIN || 'http://localhost:3005';
    const publicUrl = `${baseUrl}/lp/${accessToken}`;

    let landingPage = await LandingPage.create(schema, {
      tenantId,
      documentId,
      documentType,
      templateId,
      accessToken,
      publicUrl,
      content: contentPackage,
      password,
      expiresAt
    });

    // Send email and abort if it fails
    if (patientData.email) {
      const EmailService = require('../../../services/emailService');
      const { Tenant } = require('../../../infra/models/Tenant');
      let branding = null;
      try {
        const { TenantBranding } = require('../../../infra/models/TenantBranding');
        branding = await TenantBranding.findByTenantId(tenantId);
      } catch (brandingError) {
        console.error('Failed to load tenant branding for landing page email:', brandingError);
      }

      const tenant = await Tenant.findById(tenantId);

      try {
        await EmailService.sendPublicQuoteEmail({
          tenantId,
          tenantSchema: schema,
          tenantTimezone: tenant?.timezone,
          recipientEmail: patientData.email,
          quoteNumber: documentData.number,
          patientName: `${patientData.first_name} ${patientData.last_name}`.trim(),
          clinicName: branding?.companyName || 'Our Clinic',
          publicLink: publicUrl,
          password,
          patientId: documentData.patient_id,
          quoteId: documentType === 'quote' ? documentData.id : null,
          publicQuoteId: landingPage.id
        });
      } catch (emailError) {
        console.error('Landing page email send failed. Rolling back generated link.', emailError);

        // Rollback: delete the created landing page
        try {
          await LandingPage.deleteById(landingPage.id, schema);
        } catch (rollbackError) {
          console.error('Failed to rollback landing page after email failure:', rollbackError);
        }

        if (emailError.message && emailError.message.includes('Communication settings not configured')) {
          emailError.code = 'SMTP_NOT_CONFIGURED';
        } else {
          emailError.code = emailError.code || 'LANDING_PAGE_EMAIL_FAILED';
        }
        throw emailError;
      }
    }

    // Return landing page data with URL and password in meta
    res.status(201).json({
      data: landingPage.toJSON(),
      meta: {
        code: 'LANDING_PAGE_CREATED',
        message: `Landing page link created successfully!`,
        password: password,
        publicUrl: landingPage.publicUrl
      }
    });
  } catch (error) {
    console.error('Create landing page error:', error);

    const errorCode = error.code || 'LANDING_PAGE_CREATION_FAILED';

    res.status(500).json({
      error: {
        code: errorCode,
        message: error.message || 'Failed to create landing page link'
      },
      message: error.message || 'Failed to create landing page link'
    });
  }
});

/**
 * @openapi
 * /tq/landing-pages/{documentIdentifier}:
 *   get:
 *     tags: [TQ - Landing Pages]
 *     summary: Get landing page links for a document
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Retrieves all active landing page links for a specific document.
 *       Accepts document UUID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: documentIdentifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Document UUID
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *           enum: [quote, prevention]
 *           default: quote
 *     responses:
 *       200:
 *         description: List of landing page links
 *       404:
 *         description: Document not found
 */
router.get('/:documentIdentifier', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { documentIdentifier } = req.params;
    const { document_type = 'quote' } = req.query;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const landingPages = await LandingPage.findByDocumentId(documentIdentifier, schema, document_type);

    res.json({
      data: landingPages.map(lp => lp.toJSON())
    });
  } catch (error) {
    console.error('Get landing pages error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get landing page links'
    });
  }
});

/**
 * @openapi
 * /tq/landing-pages/{id}:
 *   delete:
 *     tags: [TQ - Landing Pages]
 *     summary: Revoke landing page link
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Revokes (deactivates) a landing page link.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Landing page link revoked successfully
 *       404:
 *         description: Landing page link not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { id } = req.params;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const landingPage = await LandingPage.findById(id, schema);
    await landingPage.revoke(schema);

    res.json({
      meta: {
        code: 'LANDING_PAGE_REVOKED',
        message: 'Landing page link revoked successfully'
      }
    });
  } catch (error) {
    console.error('Revoke landing page error:', error);

    if (error instanceof LandingPageNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Landing page link not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke landing page link'
    });
  }
});

/**
 * @openapi
 * /tq/landing-pages/{id}/new-password:
 *   post:
 *     tags: [TQ - Landing Pages]
 *     summary: Generate new password for landing page link
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Generates a new password for an existing landing page link.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: New password generated successfully
 *       404:
 *         description: Landing page link not found
 */
router.post('/:id/new-password', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { id } = req.params;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    // Find the landing page
    const landingPage = await LandingPage.findById(id, schema);
    const previousPasswordHash = landingPage.passwordHash;

    // Generate new password
    const newPassword = LandingPage.generatePassword();
    const passwordHash = await LandingPage.hashPassword(newPassword);

    // Update the password hash in the database
    const updateQuery = `
      UPDATE ${schema}.landing_page
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await database.query(updateQuery, [passwordHash, id]);

    if (result.rows.length === 0) {
      throw new LandingPageNotFoundError(id);
    }

    const updatedLandingPage = new LandingPage(result.rows[0]);

    // Get document and patient data for email
    let documentDataQuery;
    if (updatedLandingPage.documentType === 'prevention') {
      documentDataQuery = `
        SELECT
          prv.id as document_id,
          prv.number as document_number,
          s.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.email as patient_email
        FROM ${schema}.prevention prv
        INNER JOIN ${schema}.session s ON prv.session_id = s.id
        INNER JOIN ${schema}.patient p ON s.patient_id = p.id
        WHERE prv.id = $1
      `;
    } else {
      documentDataQuery = `
        SELECT
          q.id as document_id,
          q.number as document_number,
          s.patient_id,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.email as patient_email
        FROM ${schema}.quote q
        INNER JOIN ${schema}.session s ON q.session_id = s.id
        INNER JOIN ${schema}.patient p ON s.patient_id = p.id
        WHERE q.id = $1
      `;
    }

    const documentDataResult = await database.query(documentDataQuery, [updatedLandingPage.documentId]);

    if (documentDataResult.rows.length > 0 && documentDataResult.rows[0].patient_email) {
      const docInfo = documentDataResult.rows[0];
      const EmailService = require('../../../services/emailService');
      const { Tenant } = require('../../../infra/models/Tenant');

      let branding = null;
      try {
        const { TenantBranding } = require('../../../infra/models/TenantBranding');
        branding = await TenantBranding.findByTenantId(updatedLandingPage.tenantId);
      } catch (brandingError) {
        console.error('Failed to load tenant branding for new password email:', brandingError);
      }

      const tenant = await Tenant.findById(updatedLandingPage.tenantId);

      try {
        await EmailService.sendPublicQuoteEmail({
          tenantId: updatedLandingPage.tenantId,
          tenantSchema: schema,
          tenantTimezone: tenant?.timezone,
          recipientEmail: docInfo.patient_email,
          quoteNumber: docInfo.document_number,
          patientName: `${docInfo.patient_first_name} ${docInfo.patient_last_name}`.trim(),
          clinicName: branding?.companyName || 'Our Clinic',
          publicLink: updatedLandingPage.publicUrl,
          password: newPassword,
          patientId: docInfo.patient_id,
          quoteId: updatedLandingPage.documentType === 'quote' ? docInfo.document_id : null,
          publicQuoteId: updatedLandingPage.id
        });
      } catch (emailError) {
        console.error('New password email send failed. Rolling back password change.', emailError);

        try {
          await database.query(
            `
              UPDATE ${schema}.landing_page
              SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `,
            [previousPasswordHash || null, id]
          );
        } catch (rollbackError) {
          console.error('Failed to rollback password hash after email failure:', rollbackError);
        }

        emailError.code = emailError.code || 'LANDING_PAGE_EMAIL_FAILED';
        throw emailError;
      }
    }

    res.json({
      data: updatedLandingPage.toJSON(),
      meta: {
        code: 'NEW_PASSWORD_GENERATED',
        message: 'New password generated successfully',
        password: newPassword
      }
    });
  } catch (error) {
    console.error('Generate new password error:', error);

    if (error instanceof LandingPageNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Landing page link not found'
      });
    }

    const isEmailFailure = error.code === 'LANDING_PAGE_EMAIL_FAILED';

    res.status(500).json({
      error: {
        code: isEmailFailure ? 'LANDING_PAGE_EMAIL_FAILED' : 'LANDING_PAGE_NEW_PASSWORD_FAILED',
        message: isEmailFailure ? 'Failed to send landing page email' : 'Failed to generate new password'
      },
      message: isEmailFailure ? 'Failed to send landing page email' : 'Failed to generate new password'
    });
  }
});

module.exports = router;
