const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { Quote, QuoteNotFoundError } = require('../../../infra/models/Quote');
const { QuoteItem, QuoteItemNotFoundError } = require('../../../infra/models/QuoteItem');

const router = express.Router();

// Apply tenant middleware to all TQ routes
router.use(tenantMiddleware);

// Apply authentication to all TQ routes
router.use(requireAuth);

// Apply rate limiting
const tqRateLimit = createRateLimit(15 * 60 * 1000, 200); // 200 requests per 15 minutes
router.use(tqRateLimit);

/**
 * @swagger
 * components:
 *   schemas:
 *     Quote:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         number:
 *           type: string
 *           example: "QUO000001"
 *         sessionId:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         total:
 *           type: number
 *           format: decimal
 *         status:
 *           type: string
 *           enum: [draft, sent, approved, rejected, expired]
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     QuoteItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         quoteId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         basePrice:
 *           type: number
 *           format: decimal
 *         discountAmount:
 *           type: number
 *           format: decimal
 *         finalPrice:
 *           type: number
 *           format: decimal
 *         quantity:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tq/quotes:
 *   get:
 *     summary: List all quotes
 *     tags: [TQ - Quotes]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, approved, rejected, expired]
 *       - in: query
 *         name: includeSession
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of quotes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quote'
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const {
      sessionId,
      status,
      includeSession = 'false',
      limit = 50,
      offset = 0
    } = req.query;

    const options = {
      sessionId,
      status,
      includeSession: includeSession === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const quotes = await Quote.findAll(schema, options);
    const quotesJson = quotes.map(quote => quote.toJSON());

    res.json(quotesJson);
  } catch (error) {
    console.error('Error listing quotes:', error);
    res.status(500).json({ error: 'Failed to list quotes' });
  }
});

/**
 * @swagger
 * /tq/quotes/{id}:
 *   get:
 *     summary: Get quote by ID
 *     tags: [TQ - Quotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: includeItems
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeSession
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Quote details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quote'
 *       404:
 *         description: Quote not found
 */
router.get('/:id', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id } = req.params;
    const {
      includeItems = 'false',
      includeSession = 'false'
    } = req.query;

    const quote = await Quote.findById(
      id,
      schema,
      includeItems === 'true',
      includeSession === 'true'
    );

    res.json({
      data: quote.toJSON()
    });
  } catch (error) {
    if (error instanceof QuoteNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error getting quote:', error);
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

/**
 * @swagger
 * /tq/quotes:
 *   post:
 *     summary: Create new quote
 *     tags: [TQ - Quotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, sent, approved, rejected, expired]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Quote created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quote'
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { sessionId, content, status, expiresAt } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const quote = await Quote.create({
      sessionId,
      content,
      status,
      expiresAt
    }, schema);

    res.status(201).json(quote.toJSON());
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

/**
 * @swagger
 * /tq/quotes/{id}:
 *   put:
 *     summary: Update quote
 *     tags: [TQ - Quotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               total:
 *                 type: number
 *                 format: decimal
 *               status:
 *                 type: string
 *                 enum: [draft, sent, approved, rejected, expired]
 *     responses:
 *       200:
 *         description: Quote updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quote'
 *       404:
 *         description: Quote not found
 */
router.put('/:id', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id } = req.params;
    const { content, total, status, expiresAt } = req.body;

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (total !== undefined) updates.total = total;
    if (status !== undefined) updates.status = status;
    if (expiresAt !== undefined) updates.expires_at = expiresAt;

    const quote = await Quote.update(id, updates, schema);

    res.json({
      data: quote.toJSON(),
      meta: {
        code: 'QUOTE_UPDATED',
        message: 'Quote updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof QuoteNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

/**
 * @swagger
 * /tq/quotes/{id}:
 *   delete:
 *     summary: Delete quote
 *     tags: [TQ - Quotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quote deleted successfully
 *       404:
 *         description: Quote not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id } = req.params;

    await Quote.delete(id, schema);

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    if (error instanceof QuoteNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

/**
 * @swagger
 * /tq/quotes/{id}/items:
 *   get:
 *     summary: Get quote items
 *     tags: [TQ - Quote Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of quote items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuoteItem'
 */
router.get('/:id/items', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id: quoteId } = req.params;

    const items = await QuoteItem.findByQuoteId(quoteId, schema);
    const itemsJson = items.map(item => item.toJSON());

    res.json(itemsJson);
  } catch (error) {
    console.error('Error getting quote items:', error);
    res.status(500).json({ error: 'Failed to get quote items' });
  }
});

/**
 * @swagger
 * /tq/quotes/{id}/items:
 *   post:
 *     summary: Replace all items in quote (bulk update)
 *     description: Replaces all existing items in the quote with the provided array. Send empty array to remove all items.
 *     tags: [TQ - Quote Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                   properties:
 *                     itemId:
 *                       type: string
 *                       format: uuid
 *                       description: Reference to item in catalog
 *                     quantity:
 *                       type: integer
 *                       default: 1
 *                     discountAmount:
 *                       type: number
 *                       format: decimal
 *                       default: 0
 *     responses:
 *       200:
 *         description: Quote items replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     quote:
 *                       $ref: '#/components/schemas/Quote'
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QuoteItem'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
 */
router.post('/:id/items', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id: quoteId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }

    // Replace all items
    const createdItems = await QuoteItem.replaceAll(quoteId, items, schema);

    // Recalculate quote total
    const { total } = await Quote.calculateTotal(quoteId, schema);

    // Get updated quote with session data
    const quote = await Quote.findById(quoteId, schema, false, true);

    res.json({
      data: {
        quote: quote.toJSON(),
        items: createdItems.map(item => item.toJSON())
      },
      meta: {
        code: 'QUOTE_ITEMS_UPDATED',
        message: 'Quote items updated successfully'
      }
    });
  } catch (error) {
    console.error('Error replacing quote items:', error);
    res.status(500).json({ error: error.message || 'Failed to replace quote items' });
  }
});


/**
 * @swagger
 * /tq/quotes/{id}/calculate:
 *   post:
 *     summary: Recalculate quote total
 *     tags: [TQ - Quotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quote total recalculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   format: decimal
 */
router.post('/:id/calculate', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id: quoteId } = req.params;

    const result = await Quote.calculateTotal(quoteId, schema);

    res.json(result);
  } catch (error) {
    console.error('Error calculating quote total:', error);
    res.status(500).json({ error: 'Failed to calculate quote total' });
  }
});

module.exports = router;