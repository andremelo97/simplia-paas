const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { ClinicalReport, ClinicalReportNotFoundError } = require('../../../infra/models/ClinicalReport');

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
 *     ClinicalReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         number:
 *           type: string
 *           example: "CLR000001"
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
 * /tq/clinical-reports:
 *   get:
 *     summary: List all clinical reports
 *     tags: [TQ - Clinical Reports]
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
 *         description: List of clinical reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClinicalReport'
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

    const [reports, total] = await Promise.all([
      ClinicalReport.findAll(schema, options),
      ClinicalReport.count(schema, options)
    ]);

    res.json({
      data: reports.map(r => r.toJSON()),
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching clinical reports:', error);
    res.status(500).json({
      error: 'Failed to fetch clinical reports',
      meta: { code: 'CLINICAL_REPORTS_FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-reports/{id}:
 *   get:
 *     summary: Get a clinical report by ID
 *     tags: [TQ - Clinical Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Clinical report details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalReport'
 *       404:
 *         description: Clinical report not found
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
    const report = await ClinicalReport.findById(id, schema);

    res.json({
      data: report.toJSON()
    });
  } catch (error) {
    if (error instanceof ClinicalReportNotFoundError) {
      return res.status(404).json({
        error: error.message,
        meta: { code: 'CLINICAL_REPORT_NOT_FOUND' }
      });
    }

    console.error('Error fetching clinical report:', error);
    res.status(500).json({
      error: 'Failed to fetch clinical report',
      meta: { code: 'CLINICAL_REPORT_FETCH_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-reports:
 *   post:
 *     summary: Create a new clinical report
 *     tags: [TQ - Clinical Reports]
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
 *         description: Clinical report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalReport'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "CLINICAL_REPORT_CREATED"
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

    const report = await ClinicalReport.create({
      sessionId,
      content,
      createdByUserId: req.user?.userId || null
    }, schema);

    res.status(201).json({
      data: report.toJSON(),
      meta: {
        code: 'CLINICAL_REPORT_CREATED',
        message: 'Clinical report created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating clinical report:', error);
    res.status(500).json({
      error: 'Failed to create clinical report',
      meta: { code: 'CLINICAL_REPORT_CREATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-reports/{id}:
 *   put:
 *     summary: Update a clinical report
 *     tags: [TQ - Clinical Reports]
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
 *         description: Clinical report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalReport'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "CLINICAL_REPORT_UPDATED"
 *       404:
 *         description: Clinical report not found
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

    const report = await ClinicalReport.update(id, updates, schema);

    res.json({
      data: report.toJSON(),
      meta: {
        code: 'CLINICAL_REPORT_UPDATED',
        message: 'Clinical report updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof ClinicalReportNotFoundError) {
      return res.status(404).json({
        error: error.message,
        meta: { code: 'CLINICAL_REPORT_NOT_FOUND' }
      });
    }

    console.error('Error updating clinical report:', error);
    res.status(500).json({
      error: 'Failed to update clinical report',
      meta: { code: 'CLINICAL_REPORT_UPDATE_ERROR' }
    });
  }
});

/**
 * @swagger
 * /tq/clinical-reports/{id}:
 *   delete:
 *     summary: Delete a clinical report
 *     tags: [TQ - Clinical Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Clinical report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ClinicalReport'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "CLINICAL_REPORT_DELETED"
 *       404:
 *         description: Clinical report not found
 */
router.delete('/:id', async (req, res) => {
  // Clinical Reports cannot be deleted - data integrity requirement
  return res.status(403).json({
    error: {
      code: 'CLINICAL_REPORT_DELETE_NOT_ALLOWED',
      message: 'Clinical reports cannot be deleted. This operation is not permitted for data integrity reasons.'
    }
  });
});

module.exports = router;
