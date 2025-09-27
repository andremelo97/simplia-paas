const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { Item, ItemNotFoundError } = require('../../../infra/models/Item');

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
 *     Item:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         basePrice:
 *           type: number
 *           format: decimal
 *         active:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tq/items:
 *   get:
 *     summary: List all items
 *     tags: [TQ - Items]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const {
      page = 1,
      pageSize = 10,
      query = '',
      activeOnly = false
    } = req.query;

    const result = await Item.findAll(schema, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      query,
      activeOnly: activeOnly === 'true'
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing items:', error);
    res.status(500).json({ error: 'Failed to list items' });
  }
});

/**
 * @swagger
 * /tq/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [TQ - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 */
router.get('/:id', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id } = req.params;

    const item = await Item.findById(id, schema);
    res.json(item);
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error finding item:', error);
    res.status(500).json({ error: 'Failed to find item' });
  }
});

/**
 * @swagger
 * /tq/items:
 *   post:
 *     summary: Create a new item
 *     tags: [TQ - Items]
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
 *               active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { name, description, basePrice, active = true } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (basePrice === undefined || basePrice === null || typeof basePrice !== 'number' || basePrice < 0) {
      return res.status(400).json({ error: 'Base price must be a non-negative number' });
    }

    const item = await Item.create(schema, {
      name: name.trim(),
      description: description ? description.trim() : null,
      basePrice,
      active
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/**
 * @swagger
 * /tq/items/{id}:
 *   put:
 *     summary: Update an existing item
 *     tags: [TQ - Items]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *                 format: decimal
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found
 *       400:
 *         description: Invalid input
 */
router.put('/:id', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id } = req.params;
    const { name, description, basePrice, active } = req.body;

    // Validation
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }

    if (basePrice !== undefined && (typeof basePrice !== 'number' || basePrice < 0)) {
      return res.status(400).json({ error: 'Base price must be a non-negative number' });
    }

    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Active must be a boolean' });
    }

    const item = await Item.update(id, schema, {
      name: name ? name.trim() : undefined,
      description: description ? description.trim() : undefined,
      basePrice,
      active
    });

    res.json(item);
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * @swagger
 * /tq/items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags: [TQ - Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 *       400:
 *         description: Cannot delete item in use
 */
router.delete('/:id', async (req, res) => {
  try {
    const schema = req.tenant.schema;
    const { id } = req.params;

    await Item.delete(id, schema);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Cannot delete item')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});


module.exports = router;