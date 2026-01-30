const express = require('express');
const database = require('../../../infra/db/database');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { PublicQuote, PublicQuoteNotFoundError } = require('../../../infra/models/PublicQuote');
const { Quote, QuoteNotFoundError } = require('../../../infra/models/Quote');
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
 * /tq/public-quotes:
 *   get:
 *     tags: [TQ - Public Quotes]
 *     summary: List all public quotes for tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Returns all public quote links for the current tenant with quote and patient details.
 *       Supports filtering by active status and created date range.
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
 *         description: List of public quotes
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
    const { active, created_from, created_to } = req.query;

    // Build WHERE conditions
    const conditions = ['pq.tenant_id = $1'];
    const params = [req.tenant.id];
    let paramIndex = 2;

    // Filter by active status
    if (active !== undefined) {
      conditions.push(`pq.active = $${paramIndex}`);
      params.push(active === 'true');
      paramIndex++;
    }

    // Filter by created_at range (accepts ISO timestamp UTC from frontend)
    if (created_from) {
      conditions.push(`pq.created_at >= $${paramIndex}::timestamptz`);
      params.push(created_from);
      paramIndex++;
    }

    if (created_to) {
      conditions.push(`pq.created_at <= $${paramIndex}::timestamptz`);
      params.push(created_to);
      paramIndex++;
    }

    // Get all public quotes for this tenant with joined data
    const query = `
      SELECT 
        pq.*,
        q.number as quote_number,
        q.total as quote_total,
        q.status as quote_status,
        q.session_id as quote_session_id,
        s.patient_id as session_patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        pqt.name as template_name
      FROM ${schema}.public_quote pq
      LEFT JOIN ${schema}.quote q ON pq.quote_id = q.id
      LEFT JOIN ${schema}.session s ON q.session_id = s.id
      LEFT JOIN ${schema}.patient p ON s.patient_id = p.id
      LEFT JOIN ${schema}.public_quote_template pqt ON pq.template_id = pqt.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY pq.created_at DESC
    `;

    const result = await database.query(query, params);
    const publicQuotes = result.rows.map(row => new PublicQuote(row));

    res.json({
      data: publicQuotes.map(pq => pq.toJSON())
    });
  } catch (error) {
    console.error('List public quotes error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list public quotes'
    });
  }
});

/**
 * @openapi
 * /tq/public-quotes:
 *   post:
 *     tags: [TQ - Public Quotes]
 *     summary: Create public quote link
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Creates a shareable public link for a quote with auto-generated password.
 *       Password will be sent to patient's email (future implementation).
 *       Access controlled via active flag and quote.expires_at.
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
 *               - quoteId
 *             properties:
 *               quoteId:
 *                 type: string
 *                 format: uuid
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Public quote template ID to use for rendering. If not provided, default template will be used.
 *                 nullable: true
 *               password:
 *                 type: string
 *                 description: Optional password protection for the public quote link
 *                 nullable: true
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date for the public quote link
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Public quote link created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Quote not found
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { quoteId, templateId, expiresAt, tenantId, autoGeneratePassword = true } = req.body;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    if (!quoteId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'quoteId is required'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'tenantId is required'
      });
    }

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
    
    const quoteResult = await database.query(quoteQuery, [quoteId]);
    
    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quote not found'
      });
    }

    const quoteData = quoteResult.rows[0];

    // Fetch quote items
    const itemsQuery = `
      SELECT * FROM ${schema}.quote_item
      WHERE quote_id = $1
      ORDER BY created_at ASC
    `;
    const itemsResult = await database.query(itemsQuery, [quoteId]);

    // Fetch template content if templateId provided
    let templateContent = null;
    if (templateId) {
      const templateQuery = `
        SELECT content FROM ${schema}.public_quote_template
        WHERE id = $1
      `;
      const templateResult = await database.query(templateQuery, [templateId]);
      if (templateResult.rows.length > 0) {
        templateContent = templateResult.rows[0].content;
      }
    }

    // Create content package with resolved data
    // This uses EXACT same logic as frontend to ensure consistency
    const locale = getLocaleFromTimezone(req.tenant?.timezone);

    const contentPackage = createContentPackage(
      templateContent,
      {
        number: quoteData.quote_number || quoteData.number,
        total: quoteData.total,
        content: quoteData.content,
        status: quoteData.status,
        created_at: quoteData.created_at
      },
      {
        first_name: quoteData.patient_first_name,
        last_name: quoteData.patient_last_name,
        email: quoteData.patient_email,
        phone: quoteData.patient_phone
      },
      itemsResult.rows,
      { locale }
    );

    // Auto-generate secure password (always enabled for public quotes)
    const crypto = require('crypto');
    const password = autoGeneratePassword 
      ? crypto.randomBytes(6).toString('base64url') // Generates 8-char secure password (e.g., "aB3xZ9Qr")
      : null;

    // Generate access token and public URL
    const accessToken = PublicQuote.generateAccessToken();
    const baseUrl = process.env.TQ_ORIGIN || 'http://localhost:3005';
    const publicUrl = `${baseUrl}/pq/${accessToken}`;

    let publicQuote = await PublicQuote.create(schema, {
      tenantId,
      quoteId,
      templateId,
      accessToken, // Pass the pre-generated token
      publicUrl,
      content: contentPackage, // Save template + resolved data
      password,
      expiresAt
    });

    // Send email and abort if it fails
    if (quoteData.patient_email) {
      const EmailService = require('../../../services/emailService');
      const { Tenant } = require('../../../infra/models/Tenant');
      let branding = null;
      try {
        const { TenantBranding } = require('../../../infra/models/TenantBranding');
        branding = await TenantBranding.findByTenantId(tenantId);
      } catch (brandingError) {
        console.error('Failed to load tenant branding for public quote email:', brandingError);
      }

      const tenant = await Tenant.findById(tenantId);

      try {
        await EmailService.sendPublicQuoteEmail({
          tenantId,
          tenantSchema: schema,
          tenantTimezone: tenant?.timezone,
          recipientEmail: quoteData.patient_email,
          quoteNumber: quoteData.quote_number || quoteData.number,
          patientName: `${quoteData.patient_first_name} ${quoteData.patient_last_name}`.trim(),
          clinicName: branding?.companyName || 'Our Clinic',
          publicLink: publicUrl,
          password,
          patientId: quoteData.patient_id,
          quoteId: quoteData.id,
          publicQuoteId: publicQuote.id
        });
      } catch (emailError) {
        console.error('Public quote email send failed. Rolling back generated link.', emailError);

        // Rollback: delete the created public quote
        try {
          await PublicQuote.deleteById(publicQuote.id, schema);
        } catch (rollbackError) {
          console.error('Failed to rollback public quote after email failure:', rollbackError);
        }

        // Set specific error code based on error message
        if (emailError.message && emailError.message.includes('Communication settings not configured')) {
          emailError.code = 'SMTP_NOT_CONFIGURED';
        } else {
          emailError.code = emailError.code || 'PUBLIC_QUOTE_EMAIL_FAILED';
        }
        throw emailError;
      }
    }

    // Return public quote data with URL and password in meta
    res.status(201).json({
      data: publicQuote.toJSON(),
      meta: {
        code: 'PUBLIC_QUOTE_CREATED',
        message: `Public quote link created successfully!`,
        password: password, // Password for frontend to show
        publicUrl: publicQuote.publicUrl // URL for frontend to show
      }
    });
  } catch (error) {
    console.error('Create public quote error:', error);

    // Determine error code for HTTP interceptor feedback
    const errorCode = error.code || 'PUBLIC_QUOTE_CREATION_FAILED';

    res.status(500).json({
      error: {
        code: errorCode,
        message: error.message || 'Failed to create public quote link'
      },
      message: error.message || 'Failed to create public quote link'
    });
  }
});

/**
 * @openapi
 * /tq/public-quotes/{quoteIdentifier}:
 *   get:
 *     tags: [TQ - Public Quotes]
 *     summary: Get public quote links for a quote
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Retrieves all active public links for a specific quote.
 *       Accepts either quote UUID or quote number.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: quoteIdentifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Quote UUID or quote number (e.g., "Q-2024-001")
 *     responses:
 *       200:
 *         description: List of public quote links
 *       404:
 *         description: Quote not found
 */
router.get('/:quoteIdentifier', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { quoteIdentifier } = req.params;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    // Check if identifier is a UUID or quote number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quoteIdentifier);
    
    let quoteId;
    if (isUUID) {
      quoteId = quoteIdentifier;
    } else {
      // It's a quote number, find the quote by number
      const quoteQuery = `
        SELECT id FROM ${schema}.quote WHERE quote_number = $1
      `;
      const quoteResult = await database.query(quoteQuery, [quoteIdentifier]);
      
      if (quoteResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found'
        });
      }
      
      quoteId = quoteResult.rows[0].id;
    }

    const publicQuotes = await PublicQuote.findByQuoteId(quoteId, schema);

    res.json({
      data: publicQuotes.map(pq => pq.toJSON())
    });
  } catch (error) {
    console.error('Get public quotes error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get public quote links'
    });
  }
});

/**
 * @openapi
 * /tq/public-quotes/{id}:
 *   delete:
 *     tags: [TQ - Public Quotes]
 *     summary: Revoke public quote link
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Revokes (deactivates) a public quote link.
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
 *         description: Public quote link revoked successfully
 *       404:
 *         description: Public quote link not found
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

    const publicQuote = await PublicQuote.findById(id, schema);
    const previousPasswordHash = publicQuote.passwordHash;
    await publicQuote.revoke(schema);

    res.json({
      meta: {
        code: 'PUBLIC_QUOTE_REVOKED',
        message: 'Public quote link revoked successfully'
      }
    });
  } catch (error) {
    console.error('Revoke public quote error:', error);

    if (error instanceof PublicQuoteNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Public quote link not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke public quote link'
    });
  }
});

/**
 * @openapi
 * /tq/public-quotes/{id}/new-password:
 *   post:
 *     tags: [TQ - Public Quotes]
 *     summary: Generate new password for public quote link
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Generates a new password for an existing public quote link.
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
 *         description: Public quote link not found
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

    // Find the public quote
    const publicQuote = await PublicQuote.findById(id, schema);

    // Generate new password
    const newPassword = PublicQuote.generatePassword();
    const passwordHash = await PublicQuote.hashPassword(newPassword);

    // Update the password hash in the database
    const updateQuery = `
      UPDATE ${schema}.public_quote
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await database.query(updateQuery, [passwordHash, id]);
    
    if (result.rows.length === 0) {
      throw new PublicQuoteNotFoundError(id);
    }

    const updatedPublicQuote = new PublicQuote(result.rows[0]);

    // Send email with new password (best effort - doesn't block response)
    // Fetch quote and patient data for email
    const quoteDataQuery = `
      SELECT
        q.id as quote_id,
        q.number as quote_number,
        s.patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email
      FROM ${schema}.quote q
      INNER JOIN ${schema}.session s ON q.session_id = s.id
      INNER JOIN ${schema}.patient p ON s.patient_id = p.id
      WHERE q.id = $1
    `;

    const quoteDataResult = await database.query(quoteDataQuery, [updatedPublicQuote.quoteId]);

    if (quoteDataResult.rows.length > 0 && quoteDataResult.rows[0].patient_email) {
      const quoteInfo = quoteDataResult.rows[0];
      const EmailService = require('../../../services/emailService');
      const { Tenant } = require('../../../infra/models/Tenant');

      let branding = null;
      try {
        const { TenantBranding } = require('../../../infra/models/TenantBranding');
        branding = await TenantBranding.findByTenantId(updatedPublicQuote.tenantId);
      } catch (brandingError) {
        console.error('Failed to load tenant branding for new password email:', brandingError);
      }

      const tenant = await Tenant.findById(updatedPublicQuote.tenantId);

      try {
        await EmailService.sendPublicQuoteEmail({
          tenantId: updatedPublicQuote.tenantId,
          tenantSchema: schema,
          tenantTimezone: tenant?.timezone,
          recipientEmail: quoteInfo.patient_email,
          quoteNumber: quoteInfo.quote_number,
          patientName: `${quoteInfo.patient_first_name} ${quoteInfo.patient_last_name}`.trim(),
          clinicName: branding?.companyName || 'Our Clinic',
          publicLink: updatedPublicQuote.publicUrl,
          password: newPassword,
          patientId: quoteInfo.patient_id,
          quoteId: quoteInfo.quote_id,
          publicQuoteId: updatedPublicQuote.id
        });
      } catch (emailError) {
        console.error('New password email send failed. Rolling back password change.', emailError);

        try {
          await database.query(
            `
              UPDATE ${schema}.public_quote
              SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `,
            [previousPasswordHash || null, id]
          );
        } catch (rollbackError) {
          console.error('Failed to rollback password hash after email failure:', rollbackError);
        }

        emailError.code = emailError.code || 'PUBLIC_QUOTE_EMAIL_FAILED';
        throw emailError;
      }
    }

    res.json({
      data: updatedPublicQuote.toJSON(),
      meta: {
        code: 'NEW_PASSWORD_GENERATED',
        message: 'New password generated successfully',
        password: newPassword // Return the plain password only once
      }
    });
  } catch (error) {
    console.error('Generate new password error:', error);

    if (error instanceof PublicQuoteNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Public quote link not found'
      });
    }

    const isEmailFailure = error.code === 'PUBLIC_QUOTE_EMAIL_FAILED';

    res.status(500).json({
      error: {
        code: isEmailFailure ? 'PUBLIC_QUOTE_EMAIL_FAILED' : 'PUBLIC_QUOTE_NEW_PASSWORD_FAILED',
        message: isEmailFailure ? 'Failed to send public quote email' : 'Failed to generate new password'
      },
      message: isEmailFailure ? 'Failed to send public quote email' : 'Failed to generate new password'
    });
  }
});

module.exports = router;
