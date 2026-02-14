const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { Prevention, PreventionNotFoundError } = require('../../../infra/models/Prevention');

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
 *     Prevention:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         number:
 *           type: string
 *           example: "PRV000001"
 *         sessionId:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, sent, viewed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tq/prevention:
 *   get:
 *     summary: List all prevention documents
 *     tags: [TQ - Prevention]
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
 *           enum: [draft, sent, viewed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of prevention documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prevention'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    if (!schema) {
      return res.status(400).json({
        error: 'Tenant context not found',
        meta: { code: 'TENANT_CONTEXT_MISSING' }
      });
    }

    const { sessionId, status, limit = 50, offset = 0, created_from, created_to, patient_id, created_by_user_id } = req.query;

    const options = {
      sessionId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      createdFrom: created_from,
      createdTo: created_to,
      patientId: patient_id,
      createdByUserId: created_by_user_id ? parseInt(created_by_user_id) : undefined
    };

    const [preventions, total] = await Promise.all([
      Prevention.findAll(schema, options),
      Prevention.count(schema, options)
    ]);

    res.json({
      data: preventions.map(p => p.toJSON()),
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching prevention documents:', error);
    res.status(500).json({
      error: 'Failed to fetch prevention documents',
      meta: { code: 'PREVENTION_FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/prevention/{id}:
 *   get:
 *     summary: Get a prevention document by ID
 *     tags: [TQ - Prevention]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Prevention document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Prevention'
 *       404:
 *         description: Prevention document not found
 */
router.get('/:id', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    if (!schema) {
      return res.status(400).json({
        error: 'Tenant context not found',
        meta: { code: 'TENANT_CONTEXT_MISSING' }
      });
    }

    const { id } = req.params;
    const prevention = await Prevention.findById(id, schema);

    res.json({
      data: prevention.toJSON()
    });
  } catch (error) {
    if (error instanceof PreventionNotFoundError) {
      return res.status(404).json({
        error: error.message,
        meta: { code: 'PREVENTION_NOT_FOUND' }
      });
    }

    console.error('Error fetching prevention document:', error);
    res.status(500).json({
      error: 'Failed to fetch prevention document',
      meta: { code: 'PREVENTION_FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/prevention:
 *   post:
 *     summary: Create a new prevention document
 *     tags: [TQ - Prevention]
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
 *                 enum: [draft, sent, viewed]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Prevention document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Prevention'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "PREVENTION_CREATED"
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    if (!schema) {
      return res.status(400).json({
        error: 'Tenant context not found',
        meta: { code: 'TENANT_CONTEXT_MISSING' }
      });
    }

    const { sessionId, content, status = 'draft' } = req.body;

    // Validation
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required field: sessionId is required',
        meta: { code: 'VALIDATION_ERROR' }
      });
    }

    // Validate status
    if (status && !['draft', 'sent', 'viewed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: draft, sent, viewed',
        meta: { code: 'VALIDATION_ERROR' }
      });
    }

    const prevention = await Prevention.create({
      sessionId,
      content,
      status,
      createdByUserId: req.user?.userId || null
    }, schema);

    res.status(201).json({
      data: prevention.toJSON(),
      meta: {
        code: 'PREVENTION_CREATED',
        message: 'Prevention document created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating prevention document:', error);
    res.status(500).json({
      error: 'Failed to create prevention document',
      meta: { code: 'PREVENTION_CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/prevention/{id}:
 *   put:
 *     summary: Update a prevention document
 *     tags: [TQ - Prevention]
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
 *               status:
 *                 type: string
 *                 enum: [draft, sent, viewed]
 *     responses:
 *       200:
 *         description: Prevention document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Prevention'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "PREVENTION_UPDATED"
 *       404:
 *         description: Prevention document not found
 */
router.put('/:id', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    if (!schema) {
      return res.status(400).json({
        error: 'Tenant context not found',
        meta: { code: 'TENANT_CONTEXT_MISSING' }
      });
    }

    const { id } = req.params;
    const { content, status } = req.body;

    // Validate status if provided
    if (status && !['draft', 'sent', 'viewed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: draft, sent, viewed',
        meta: { code: 'VALIDATION_ERROR' }
      });
    }

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;

    const prevention = await Prevention.update(id, updates, schema);

    res.json({
      data: prevention.toJSON(),
      meta: {
        code: 'PREVENTION_UPDATED',
        message: 'Prevention document updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof PreventionNotFoundError) {
      return res.status(404).json({
        error: error.message,
        meta: { code: 'PREVENTION_NOT_FOUND' }
      });
    }

    console.error('Error updating prevention document:', error);
    res.status(500).json({
      error: 'Failed to update prevention document',
      meta: { code: 'PREVENTION_UPDATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/prevention/{id}:
 *   delete:
 *     summary: Delete a prevention document
 *     tags: [TQ - Prevention]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       403:
 *         description: Delete not allowed
 */
router.delete('/:id', async (req, res) => {
  // Prevention documents cannot be deleted - data integrity requirement
  return res.status(403).json({
    error: {
      code: 'PREVENTION_DELETE_NOT_ALLOWED',
      message: 'Prevention documents cannot be deleted. This operation is not permitted for data integrity reasons.'
    }
  });
});

module.exports = router;
