const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { ClinicalNote, ClinicalNoteNotFoundError } = require('../../../infra/models/ClinicalNote');

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
 *     ClinicalNote:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         number:
 *           type: string
 *           example: "CLN000001"
 *         sessionId:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tq/clinical-notes:
 *   get:
 *     summary: List all clinical notes
 *     tags: [TQ - Clinical Notes]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: List of clinical notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClinicalNote'
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

    const { sessionId, limit = 50, offset = 0, created_from, created_to, patient_id, created_by_user_id } = req.query;

    const options = {
      sessionId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      createdFrom: created_from,
      createdTo: created_to,
      patientId: patient_id,
      createdByUserId: created_by_user_id ? parseInt(created_by_user_id) : undefined
    };

    const [notes, total] = await Promise.all([
      ClinicalNote.findAll(schema, options),
      ClinicalNote.count(schema, options)
    ]);

    res.json({
      data: notes.map(n => n.toJSON()),
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching clinical notes:', error);
    res.status(500).json({
      error: 'Failed to fetch clinical notes',
      meta: { code: 'CLINICAL_NOTES_FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-notes/{id}:
 *   get:
 *     summary: Get a clinical note by ID
 *     tags: [TQ - Clinical Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Clinical note details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalNote'
 *       404:
 *         description: Clinical note not found
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
    const note = await ClinicalNote.findById(id, schema);

    res.json({
      data: note.toJSON()
    });
  } catch (error) {
    if (error instanceof ClinicalNoteNotFoundError) {
      return res.status(404).json({
        error: error.message,
        meta: { code: 'CLINICAL_NOTE_NOT_FOUND' }
      });
    }

    console.error('Error fetching clinical note:', error);
    res.status(500).json({
      error: 'Failed to fetch clinical note',
      meta: { code: 'CLINICAL_NOTE_FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-notes:
 *   post:
 *     summary: Create a new clinical note
 *     tags: [TQ - Clinical Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - content
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Clinical note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalNote'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "CLINICAL_NOTE_CREATED"
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

    const { sessionId, content } = req.body;

    // Validation
    if (!sessionId || !content) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId and content are required',
        meta: { code: 'VALIDATION_ERROR' }
      });
    }

    const note = await ClinicalNote.create({
      sessionId,
      content,
      createdByUserId: req.user?.userId || null
    }, schema);

    res.status(201).json({
      data: note.toJSON(),
      meta: {
        code: 'CLINICAL_NOTE_CREATED',
        message: 'Clinical note created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating clinical note:', error);
    res.status(500).json({
      error: 'Failed to create clinical note',
      meta: { code: 'CLINICAL_NOTE_CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-notes/{id}:
 *   put:
 *     summary: Update a clinical note
 *     tags: [TQ - Clinical Notes]
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
 *     responses:
 *       200:
 *         description: Clinical note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalNote'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "CLINICAL_NOTE_UPDATED"
 *       404:
 *         description: Clinical note not found
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
    const { content } = req.body;

    const updates = {};
    if (content !== undefined) updates.content = content;

    const note = await ClinicalNote.update(id, updates, schema);

    res.json({
      data: note.toJSON(),
      meta: {
        code: 'CLINICAL_NOTE_UPDATED',
        message: 'Clinical note updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof ClinicalNoteNotFoundError) {
      return res.status(404).json({
        error: error.message,
        meta: { code: 'CLINICAL_NOTE_NOT_FOUND' }
      });
    }

    console.error('Error updating clinical note:', error);
    res.status(500).json({
      error: 'Failed to update clinical note',
      meta: { code: 'CLINICAL_NOTE_UPDATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-notes/{id}:
 *   delete:
 *     summary: Delete a clinical note
 *     tags: [TQ - Clinical Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Clinical note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalNote'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "CLINICAL_NOTE_DELETED"
 *       404:
 *         description: Clinical note not found
 */
router.delete('/:id', async (req, res) => {
  // Clinical Notes cannot be deleted - data integrity requirement
  return res.status(403).json({
    error: {
      code: 'CLINICAL_NOTE_DELETE_NOT_ALLOWED',
      message: 'Clinical notes cannot be deleted. This operation is not permitted for data integrity reasons.'
    }
  });
});

module.exports = router;
