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
    const schema = req.tenantSchema;
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
    const schema = req.tenantSchema;
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

    res.json(quote.toJSON());
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
    const schema = req.tenantSchema;
    const { sessionId, content, status } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const quote = await Quote.create({
      sessionId,
      content,
      status
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
    const schema = req.tenantSchema;
    const { id } = req.params;
    const { content, total, status } = req.body;

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (total !== undefined) updates.total = total;
    if (status !== undefined) updates.status = status;

    const quote = await Quote.update(id, updates, schema);

    res.json(quote.toJSON());
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
    const schema = req.tenantSchema;
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
    const schema = req.tenantSchema;
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
 *     summary: Add item to quote
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
 *               - name
 *               - basePrice
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *                 format: decimal
 *               discountAmount:
 *                 type: number
 *                 format: decimal
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Quote item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteItem'
 */
router.post('/:id/items', async (req, res) => {
  try {
    const schema = req.tenantSchema;
    const { id: quoteId } = req.params;
    const { name, description, basePrice, discountAmount, quantity } = req.body;

    if (!name || basePrice === undefined) {
      return res.status(400).json({ error: 'name and basePrice are required' });
    }

    const item = await QuoteItem.create({
      quoteId,
      name,
      description,
      basePrice,
      discountAmount,
      quantity
    }, schema);

    // Recalculate quote total
    await Quote.calculateTotal(quoteId, schema);

    res.status(201).json(item.toJSON());
  } catch (error) {
    console.error('Error creating quote item:', error);
    res.status(500).json({ error: 'Failed to create quote item' });
  }
});

/**
 * @swagger
 * /tq/quotes/{quoteId}/items/{itemId}:
 *   put:
 *     summary: Update quote item
 *     tags: [TQ - Quote Items]
 *     parameters:
 *       - in: path
 *         name: quoteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *                 format: decimal
 *               discountAmount:
 *                 type: number
 *                 format: decimal
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quote item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteItem'
 *       404:
 *         description: Quote item not found
 */
router.put('/:quoteId/items/:itemId', async (req, res) => {
  try {
    const schema = req.tenantSchema;
    const { quoteId, itemId } = req.params;
    const { name, description, basePrice, discountAmount, quantity } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (basePrice !== undefined) updates.base_price = basePrice;
    if (discountAmount !== undefined) updates.discount_amount = discountAmount;
    if (quantity !== undefined) updates.quantity = quantity;

    const item = await QuoteItem.update(itemId, updates, schema);

    // Recalculate quote total
    await Quote.calculateTotal(quoteId, schema);

    res.json(item.toJSON());
  } catch (error) {
    if (error instanceof QuoteItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error updating quote item:', error);
    res.status(500).json({ error: 'Failed to update quote item' });
  }
});

/**
 * @swagger
 * /tq/quotes/{quoteId}/items/{itemId}:
 *   delete:
 *     summary: Delete quote item
 *     tags: [TQ - Quote Items]
 *     parameters:
 *       - in: path
 *         name: quoteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quote item deleted successfully
 *       404:
 *         description: Quote item not found
 */
router.delete('/:quoteId/items/:itemId', async (req, res) => {
  try {
    const schema = req.tenantSchema;
    const { quoteId, itemId } = req.params;

    await QuoteItem.delete(itemId, schema);

    // Recalculate quote total
    await Quote.calculateTotal(quoteId, schema);

    res.json({ message: 'Quote item deleted successfully' });
  } catch (error) {
    if (error instanceof QuoteItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error deleting quote item:', error);
    res.status(500).json({ error: 'Failed to delete quote item' });
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
    const schema = req.tenantSchema;
    const { id: quoteId } = req.params;

    const result = await Quote.calculateTotal(quoteId, schema);

    res.json(result);
  } catch (error) {
    console.error('Error calculating quote total:', error);
    res.status(500).json({ error: 'Failed to calculate quote total' });
  }
});

module.exports = router;