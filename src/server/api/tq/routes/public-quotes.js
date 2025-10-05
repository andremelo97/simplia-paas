const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { PublicQuote, PublicQuoteNotFoundError } = require('../../../infra/models/PublicQuote');
const { Quote, QuoteNotFoundError } = require('../../../infra/models/Quote');

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
    const { quoteId, templateId, password, expiresAt } = req.body;

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

    // Verify quote exists
    try {
      await Quote.findById(quoteId, schema);
    } catch (error) {
      if (error instanceof QuoteNotFoundError) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote not found'
        });
      }
      throw error;
    }

    const publicQuote = await PublicQuote.create(schema, {
      quoteId,
      templateId,
      password,
      expiresAt
    });

    res.status(201).json({
      data: publicQuote.toJSON(),
      meta: {
        code: 'PUBLIC_QUOTE_CREATED',
        message: 'Public quote link created successfully'
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
 * /tq/public-quotes/by-quote/{quoteId}:
 *   get:
 *     tags: [TQ - Public Quotes]
 *     summary: Get public quote links for a quote
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Retrieves all active public links for a specific quote.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: quoteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of public quote links
 */
router.get('/by-quote/:quoteId', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { quoteId } = req.params;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
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
