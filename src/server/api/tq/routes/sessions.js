const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { Session, SessionNotFoundError } = require('../../../infra/models/Session');

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
 * /tq/sessions:
 *   get:
 *     tags: [TQ - Sessions]
 *     summary: List all sessions for tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all sessions within the tenant's schema with optional filtering and pagination.
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
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter sessions by patient UUID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, in_progress, completed, cancelled]
 *         description: Filter sessions by status
 *       - in: query
 *         name: includePatient
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include patient data in response
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of sessions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of sessions to skip
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
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

    const { patientId, status, includePatient = false, limit = 50, offset = 0 } = req.query;

    // Parse and validate pagination params
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);
    const shouldIncludePatient = includePatient === 'true' || includePatient === true;

    const options = {
      patientId,
      status,
      includePatient: shouldIncludePatient,
      limit: parsedLimit,
      offset: parsedOffset
    };

    // Get sessions and total count
    const [sessions, total] = await Promise.all([
      Session.findAll(schema, options),
      Session.count(schema, options)
    ]);

    res.json({
      data: sessions.map(session => session.toJSON()),
      meta: {
        total,
        limit: parsedLimit,
        offset: parsedOffset
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get sessions'
    });
  }
});

/**
 * @openapi
 * /tq/sessions/{id}:
 *   get:
 *     tags: [TQ - Sessions]
 *     summary: Get session by ID
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get a specific session by UUID within the tenant's schema.
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
 *         description: Session UUID
 *       - in: query
 *         name: includePatient
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include patient data in response
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Session'
 *       404:
 *         description: Session not found
 *       400:
 *         description: Missing or invalid tenant header
 *       401:
 *         description: Authentication required
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { includePatient = false } = req.query;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const shouldIncludePatient = includePatient === 'true' || includePatient === true;
    const session = await Session.findById(id, schema, shouldIncludePatient);

    res.json({
      data: session.toJSON()
    });
  } catch (error) {
    console.error('Get session error:', error);

    if (error instanceof SessionNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get session'
    });
  }
});

/**
 * @openapi
 * /tq/sessions:
 *   post:
 *     tags: [TQ - Sessions]
 *     summary: Create new session
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Create a new session within the tenant's schema.
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
 *             required: [patientId]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the patient this session belongs to
 *               transcription:
 *                 type: string
 *                 description: Transcription text content
 *               status:
 *                 type: string
 *                 enum: [draft, in_progress, completed, cancelled]
 *                 default: draft
 *                 description: Session status
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Session'
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

    const { patientId, transcriptionId, status = 'draft' } = req.body;

    if (!patientId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Patient ID is required'
      });
    }

    const sessionData = {
      patientId,
      transcriptionId,
      status
    };

    const session = await Session.create(sessionData, schema);

    res.status(201).json({
      data: session.toJSON(),
      meta: {
        code: 'SESSION_CREATED',
        message: 'Session created successfully'
      }
    });
  } catch (error) {
    console.error('Create session error:', error);

    // Handle foreign key constraint errors (invalid patient ID)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid patient ID'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create session'
    });
  }
});

/**
 * @openapi
 * /tq/sessions/{id}:
 *   put:
 *     tags: [TQ - Sessions]
 *     summary: Update session
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Update an existing session within the tenant's schema.
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
 *         description: Session UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transcription:
 *                 type: string
 *                 description: Transcription text content
 *               status:
 *                 type: string
 *                 enum: [draft, in_progress, completed, cancelled]
 *                 description: Session status
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Session'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       404:
 *         description: Session not found
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

    const { transcriptionId, status, transcriptionText } = req.body;

    const updates = {};
    if (transcriptionId !== undefined) updates.transcription_id = transcriptionId;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0 && transcriptionText === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No valid fields to update'
      });
    }

    const session = await Session.update(id, updates, schema, transcriptionText);

    res.json({
      data: session.toJSON(),
      meta: {
        code: 'SESSION_UPDATED',
        message: 'Session updated successfully'
      }
    });
  } catch (error) {
    console.error('Update session error:', error);

    if (error instanceof SessionNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update session'
    });
  }
});

/**
 * @openapi
 * /tq/sessions/{id}:
 *   delete:
 *     tags: [TQ - Sessions]
 *     summary: Delete session
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Delete a session within the tenant's schema (hard delete).
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
 *         description: Session UUID
 *     responses:
 *       200:
 *         description: Session deleted successfully
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
 *         description: Session not found
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
        message: 'Tenant schema is required'
      });
    }

    const deletedSession = await Session.delete(id, schema);

    res.json({
      success: true,
      data: deletedSession.toJSON(),
      meta: {
        code: 'SESSION_DELETED'
      }
    });
  } catch (error) {
    console.error('Error deleting session:', error);

    if (error instanceof SessionNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Session not found'
      });
    }

    // Handle session with quotes error
    if (error.code === 'SESSION_HAS_QUOTES') {
      return res.status(400).json({
        error: {
          code: 'SESSION_HAS_QUOTES',
          message: error.message,
          quoteCount: error.quoteCount
        }
      });
    }

    // Handle session with reports error
    if (error.code === 'SESSION_HAS_REPORTS') {
      return res.status(400).json({
        error: {
          code: 'SESSION_HAS_REPORTS',
          message: error.message,
          reportCount: error.reportCount
        }
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete session'
    });
  }
});

/**
 * @openapi
 * /tq/sessions/patient/{patientId}:
 *   get:
 *     tags: [TQ - Sessions]
 *     summary: Get sessions by patient ID
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all sessions for a specific patient within the tenant's schema.
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
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient UUID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, in_progress, completed, cancelled]
 *         description: Filter sessions by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of sessions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of sessions to skip
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *       400:
 *         description: Missing or invalid tenant header
 *       401:
 *         description: Authentication required
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    // Parse and validate pagination params
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const options = {
      status,
      limit: parsedLimit,
      offset: parsedOffset
    };

    const sessions = await Session.findByPatientId(patientId, schema, options);

    res.json({
      data: sessions.map(session => session.toJSON())
    });
  } catch (error) {
    console.error('Get sessions by patient error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get sessions for patient'
    });
  }
});

/**
 * @openapi
 * /tq/sessions/{id}/audio-download:
 *   get:
 *     tags: [TQ - Sessions]
 *     summary: Get secure audio download URL
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get secure download URL for session audio file. Audio is automatically deleted after 24 hours.
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session UUID
 *     responses:
 *       200:
 *         description: Audio download URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                       format: uri
 *                       description: Public download URL
 *                     filename:
 *                       type: string
 *                       description: Suggested filename
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: URL expiration (null for public URLs)
 *       404:
 *         description: Session or audio not found
 *       410:
 *         description: Audio deleted after 24 hours
 *       500:
 *         description: Server error
 */
router.get('/:id/audio-download', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: { code: 'MISSING_TENANT', message: 'Tenant context required' }
      });
    }

    // Fetch session with transcription data
    const session = await Session.findById(id, schema, true); // includeTranscription=true

    if (!session) {
      return res.status(404).json({
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      });
    }

    // Check if audio exists
    if (!session.transcription?.audio_url) {
      return res.status(404).json({
        error: {
          code: 'AUDIO_NOT_AVAILABLE',
          message: 'Audio file not found or has been deleted after 24 hours'
        }
      });
    }

    // Check if audio was deleted
    if (session.transcription.audio_deleted_at) {
      return res.status(410).json({ // 410 Gone
        error: {
          code: 'AUDIO_DELETED',
          message: 'Audio file was deleted after 24 hours retention period'
        }
      });
    }

    // Return public URL
    res.json({
      data: {
        downloadUrl: session.transcription.audio_url,
        filename: `session-${session.id}.webm`,
        expiresAt: null // Public URL doesn't expire (but file deleted after 24h)
      }
    });
  } catch (error) {
    console.error('Get audio download URL error:', error);
    res.status(500).json({
      error: {
        code: 'AUDIO_DOWNLOAD_FAILED',
        message: 'Failed to get audio download URL'
      }
    });
  }
});

module.exports = router;