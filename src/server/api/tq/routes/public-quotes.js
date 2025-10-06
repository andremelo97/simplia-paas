const express = require('express');
const database = require('../../../infra/db/database');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { PublicQuote, PublicQuoteNotFoundError } = require('../../../infra/models/PublicQuote');
const { Quote, QuoteNotFoundError } = require('../../../infra/models/Quote');
const { createContentPackage } = require('../../../services/puckTemplateResolver');

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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of public quotes
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
      WHERE pq.tenant_id = $1
      ORDER BY pq.created_at DESC
    `;

    const result = await database.query(query, [req.tenant.id]);
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
      itemsResult.rows
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

    const publicQuote = await PublicQuote.create(schema, {
      tenantId,
      quoteId,
      templateId,
      accessToken, // Pass the pre-generated token
      publicUrl,
      content: contentPackage, // Save template + resolved data
      password,
      expiresAt
    });

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
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create public quote link'
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

module.exports = router;
