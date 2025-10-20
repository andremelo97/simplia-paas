const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { Patient, PatientNotFoundError } = require('../../../infra/models/Patient');

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
 * /tq/patients:
 *   get:
 *     tags: [TQ - Patients]
 *     summary: List all patients for tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all patients within the tenant's schema with optional search and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in first name, last name, or email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of patients to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of patients to skip
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *       400:
 *         description: Missing or invalid tenant header
 *       401:
 *         description: Authentication required
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const schema = req.tenant?.schema;

    if (!tenantId || !schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const { search, limit = 50, offset = 0 } = req.query;

    // Parse and validate pagination params
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const options = {
      search,
      limit: parsedLimit,
      offset: parsedOffset
    };

    // Get patients and total count
    const [patients, total] = await Promise.all([
      Patient.findAll(schema, options),
      Patient.count(schema, options)
    ]);

    res.json({
      data: patients.map(patient => patient.toJSON()),
      meta: {
        total,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get patients'
    });
  }
});

/**
 * @openapi
 * /tq/patients/{id}:
 *   get:
 *     tags: [TQ - Patients]
 *     summary: Get patient by ID
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get a specific patient by UUID within the tenant's schema.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient UUID
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *       400:
 *         description: Missing or invalid tenant header
 *       401:
 *         description: Authentication required
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const patient = await Patient.findById(id, schema);

    res.json({
      data: patient.toJSON()
    });
  } catch (error) {
    console.error('Get patient error:', error);

    if (error instanceof PatientNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get patient'
    });
  }
});

/**
 * @openapi
 * /tq/patients:
 *   post:
 *     tags: [TQ - Patients]
 *     summary: Create new patient
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Create a new patient within the tenant's schema.
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
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Patient's first name
 *               lastName:
 *                 type: string
 *                 description: Patient's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Patient's email address
 *               phone:
 *                 type: string
 *                 description: Patient's phone number
 *               notes:
 *                 type: string
 *                 description: Additional notes about the patient
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       400:
 *         description: Validation error or missing tenant context
 *       401:
 *         description: Authentication required
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const { firstName, lastName, email, phone, notes } = req.body;

    const patientData = {
      firstName,
      lastName,
      email,
      phone,
      notes
    };

    const patient = await Patient.create(patientData, schema);

    res.status(201).json({
      data: patient.toJSON(),
      meta: {
        code: 'PATIENT_CREATED',
        message: 'Patient created successfully'
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create patient'
    });
  }
});

/**
 * @openapi
 * /tq/patients/{id}:
 *   put:
 *     tags: [TQ - Patients]
 *     summary: Update patient
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Update an existing patient within the tenant's schema.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Patient's first name
 *               lastName:
 *                 type: string
 *                 description: Patient's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Patient's email address
 *               phone:
 *                 type: string
 *                 description: Patient's phone number
 *               notes:
 *                 type: string
 *                 description: Additional notes about the patient
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       404:
 *         description: Patient not found
 *       400:
 *         description: Validation error or missing tenant context
 *       401:
 *         description: Authentication required
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const { firstName, lastName, email, phone, notes } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (notes !== undefined) updates.notes = notes;

    const patient = await Patient.update(id, updates, schema);

    res.json({
      data: patient.toJSON(),
      meta: {
        code: 'PATIENT_UPDATED',
        message: 'Patient updated successfully'
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);

    if (error instanceof PatientNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update patient'
    });
  }
});

/**
 * @openapi
 * /tq/patients/{id}:
 *   delete:
 *     tags: [TQ - Patients]
 *     summary: Delete patient
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Delete a patient within the tenant's schema (hard delete).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient UUID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       404:
 *         description: Patient not found
 *       400:
 *         description: Missing tenant context
 *       401:
 *         description: Authentication required
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    await Patient.delete(id, schema);

    res.json({
      meta: {
        code: 'PATIENT_DELETED',
        message: 'Patient deleted successfully'
      }
    });
  } catch (error) {
    console.error('Delete patient error:', error);

    if (error instanceof PatientNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Patient not found'
      });
    }

    // Handle patient with sessions error
    if (error.code === 'PATIENT_HAS_SESSIONS') {
      return res.status(400).json({
        error: {
          code: 'PATIENT_HAS_SESSIONS',
          message: error.message,
          sessionCount: error.sessionCount
        }
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete patient'
    });
  }
});

module.exports = router;