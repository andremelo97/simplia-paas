/**
 * TQ Transcription API Routes
 *
 * Handles audio upload and transcription processing independent of sessions.
 * These routes manage the transcription lifecycle without requiring patient/session context.
 *
 * All routes are tenant-scoped and require x-tenant-id header.
 */

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const DeepgramService = require('../../../services/deepgram');
const SupabaseStorageService = require('../../../services/supabaseStorage');
const db = require('../../../infra/db/database');
const { checkTranscriptionQuota } = require('../../../infra/middleware/transcriptionQuota');
const {
  DEFAULT_STT_MODEL,
  LOCALE_TO_DEEPGRAM_LANGUAGE,
  DEFAULT_LANGUAGE
} = require('../../../infra/constants/transcription');
const { TenantTranscriptionConfig } = require('../../../infra/models/TenantTranscriptionConfig');
const { TenantTranscriptionUsage } = require('../../../infra/models/TenantTranscriptionUsage');

const router = express.Router();
const deepgramService = new DeepgramService();

// Helper function to get tenant-specific storage service
function getTenantStorageService(tenantSubdomain) {
  const bucketName = `tenant-${tenantSubdomain}`;
  return new SupabaseStorageService(bucketName);
}

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/webm',
      'audio/mpeg',     // MP3
      'audio/mp4',      // MP4 audio
      'video/mp4',      // MP4 video
      'audio/wav',      // WAV
      'audio/wave',     // WAV alternative
      'audio/x-wav'     // WAV alternative
    ];

    const allowedExtensions = ['.webm', '.mp3', '.mp4', '.wav'];
    const hasValidMimeType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidMimeType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only .webm, .mp3, .mp4, and .wav audio files are allowed'), false);
    }
  }
});

/**
 * @openapi
 * /tq/transcriptions:
 *   post:
 *     tags: [TQ - Transcription]
 *     summary: Create a text-only transcription
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Create a transcription record with text content directly (no audio file).
 *       This is useful for manual transcriptions or when text is already available.
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
 *             required: [transcript]
 *             properties:
 *               transcript:
 *                 type: string
 *                 description: The transcription text content
 *               confidence_score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Optional confidence score (0-1)
 *     responses:
 *       201:
 *         description: Transcription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transcriptionId: { type: string }
 *                 transcript: { type: string }
 *                 status: { type: string, enum: [completed] }
 *                 createdAt: { type: string }
 *       400:
 *         description: Invalid request (missing transcript, etc.)
 */
router.post('/', async (req, res) => {
  const client = await db.getClient();

  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header is required' });
    }

    const { transcript, confidence_score } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript text is required' });
    }

    await client.query('BEGIN');

    // Use tenant schema from middleware
    const tenantSchema = req.tenant?.schema || `tenant_${tenantId}`;

    // Create transcription record with completed status
    const transcriptionId = uuidv4();
    const result = await client.query(
      `INSERT INTO ${tenantSchema}.transcription (id, transcript, confidence_score, transcript_status)
       VALUES ($1, $2, $3, 'completed')
       RETURNING id, transcript, confidence_score, transcript_status, created_at`,
      [transcriptionId, transcript.trim(), confidence_score || null]
    );

    await client.query('COMMIT');

    const createdTranscription = result.rows[0];

    console.log(`Text transcription created: ${transcriptionId}`);

    res.status(201).json({
      transcriptionId: createdTranscription.id,
      transcript: createdTranscription.transcript,
      confidenceScore: createdTranscription.confidence_score,
      status: createdTranscription.transcript_status,
      createdAt: createdTranscription.created_at
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transcription error:', error);

    res.status(500).json({
      error: 'Failed to create transcription',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /tq/transcriptions/quota:
 *   get:
 *     tags: [TQ - Transcription]
 *     summary: Get current transcription quota usage
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get the current month's transcription quota usage for the authenticated tenant.
 *       Returns minutes used, limit, remaining minutes, and percentage used.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *     responses:
 *       200:
 *         description: Quota data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 minutesUsed:
 *                   type: integer
 *                   description: Total minutes used in current month
 *                 limit:
 *                   type: integer
 *                   description: Monthly limit in minutes (plan or custom)
 *                 remaining:
 *                   type: integer
 *                   description: Remaining minutes (limit - used)
 *                 percentUsed:
 *                   type: number
 *                   description: Percentage of quota used (0-100)
 *                 overageAllowed:
 *                   type: boolean
 *                   description: Whether tenant can exceed quota
 *       400:
 *         description: Invalid request (missing header)
 *       404:
 *         description: Transcription config not found for tenant
 *       500:
 *         description: Server error
 */
router.get('/quota', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header is required' });
    }

    // Get tenant configuration with plan details
    const config = await TenantTranscriptionConfig.findByTenantId(parseInt(tenantId));

    // Get current month usage
    const usage = await TenantTranscriptionUsage.getCurrentMonthUsage(parseInt(tenantId));

    // Calculate effective limit (respects custom limits if allowed)
    const limit = config.getEffectiveMonthlyLimit();
    const minutesUsed = usage.totalMinutes;
    const remaining = Math.max(0, limit - minutesUsed);
    const percentUsed = limit > 0 ? Math.round((minutesUsed / limit) * 100) : 0;

    res.json({
      minutesUsed,
      limit,
      remaining,
      percentUsed,
      overageAllowed: config.overageAllowed || false
    });

  } catch (error) {
    console.error('[Quota] Error retrieving quota:', error);

    // Handle config not found
    if (error.name === 'TenantTranscriptionConfigNotFoundError') {
      return res.status(404).json({
        error: 'Transcription configuration not found for tenant',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve transcription quota',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @openapi
 * /tq/transcriptions/upload:
 *   post:
 *     tags: [TQ - Transcription]
 *     summary: Upload audio file for transcription
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Upload an audio file and create a transcription record. Returns transcription ID
 *       that can be used to start processing and check status.
 *       File size limit is 100MB. Supported formats: .webm, .mp3, .mp4, .wav
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file - .webm, .mp3, .mp4, .wav (max 100MB)
 *     responses:
 *       200:
 *         description: Audio uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 transcriptionId: { type: string }
 *                 audioUrl: { type: string }
 *                 fileName: { type: string }
 *                 fileSize: { type: number }
 *                 status: { type: string, enum: [uploaded] }
 *       400:
 *         description: Invalid request (wrong file format, etc.)
 *       413:
 *         description: File too large (max 100MB)
 */
router.post('/upload', upload.single('audio'), async (req, res) => {
  const client = await db.getClient();

  try {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    await client.query('BEGIN');

    // Use tenant schema from middleware
    const tenantSchema = req.tenant?.schema || `tenant_${tenantId}`;

    // Create transcription record first
    const transcriptionId = uuidv4();
    await client.query(
      `INSERT INTO ${tenantSchema}.transcription (id, transcript_status)
       VALUES ($1, 'uploading')`,
      [transcriptionId]
    );

    // Upload file to Supabase Storage
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Upload to tenant-specific Supabase Storage bucket
    const tenantSubdomain = req.tenant?.slug;
    if (!tenantSubdomain) {
      throw new Error('Tenant subdomain not found in request context');
    }

    const storageService = getTenantStorageService(tenantSubdomain);
    await storageService.ensureBucketExists();

    // Upload to Supabase using transcriptionId as filename
    const uploadResult = await storageService.uploadFile(
      fileBuffer,
      fileName,
      transcriptionId, // Use transcription ID instead of session ID
      'audio-files', // Folder within tenant bucket
      mimeType
    );

    // Update transcription with audio PATH (not URL) and status
    // We store the path and generate signed URLs on-demand for security
    await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET audio_url = $1,
           transcript_status = 'uploaded',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [uploadResult.path, transcriptionId]
    );

    await client.query('COMMIT');

    console.log(`Audio uploaded: ${transcriptionId} (${uploadResult.size} bytes)`);

    const response = {
      success: true,
      transcriptionId,
      audioUrl: uploadResult.signedUrl, // Return signed URL for immediate use
      fileName,
      fileSize: uploadResult.size,
      storagePath: uploadResult.path,
      status: 'uploaded'
    };

    res.json(response);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Audio upload error:', error);

    // Multer file size limit
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File too large. Maximum size is 100MB'
        }
      });
    }

    // Supabase storage size limit
    if (error.message?.includes('exceeded maximum') || error.message?.includes('maximum allowed size')) {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE_STORAGE',
          message: 'File exceeds storage limit. Maximum size is 100MB'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload audio file'
      }
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /tq/transcriptions/{transcriptionId}/transcribe:
 *   post:
 *     tags: [TQ - Transcription]
 *     summary: Start Deepgram transcription process
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Start the batch transcription process using Deepgram API. The transcription must be in 'uploaded' status
 *       with a valid audio file. Results will be delivered via webhook callback.
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
 *         name: transcriptionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transcription UUID
 *     responses:
 *       200:
 *         description: Transcription started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 transcriptionId: { type: string }
 *                 requestId: { type: string }
 *                 status: { type: string, enum: [processing] }
 *                 estimatedProcessingTime: { type: number }
 *       400:
 *         description: Invalid request (transcription not in uploaded status, no audio file, etc.)
 *       404:
 *         description: Transcription not found
 *       500:
 *         description: Deepgram API error
 */
router.post('/:transcriptionId/transcribe', checkTranscriptionQuota, async (req, res) => {
  const client = await db.getClient();

  try {
    const { transcriptionId } = req.params;
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header is required' });
    }

    await client.query('BEGIN');

    // Use tenant schema from middleware
    const tenantSchema = req.tenant?.schema || `tenant_${tenantId}`;

    // Get transcription with audio URL
    const transcriptionResult = await client.query(
      `SELECT id, audio_url, transcript_status FROM ${tenantSchema}.transcription WHERE id = $1`,
      [transcriptionId]
    );

    if (transcriptionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transcription not found' });
    }

    const transcription = transcriptionResult.rows[0];

    // Verify status is 'uploaded'
    if (transcription.transcript_status !== 'uploaded') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot start transcription. Status is '${transcription.transcript_status}', expected 'uploaded'`
      });
    }

    if (!transcription.audio_url) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No audio file uploaded for this transcription' });
    }

    // Generate signed URL for audio file (stored as path in database)
    // Deepgram needs a valid URL to access the audio file
    let audioUrlForDeepgram = transcription.audio_url;

    // Check if it's a storage path (not a full URL)
    const isStoragePath = !transcription.audio_url.startsWith('http://') &&
                          !transcription.audio_url.startsWith('https://');

    if (isStoragePath) {
      const tenantSubdomain = req.tenant?.slug;
      if (!tenantSubdomain) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tenant subdomain not found' });
      }

      const storageService = getTenantStorageService(tenantSubdomain);
      // Generate signed URL with 24h expiration for Deepgram processing
      audioUrlForDeepgram = await storageService.getSignedUrl(transcription.audio_url, 86400);
      console.log(`[Transcription] Generated signed URL for audio (24h expiry)`);
    }

    // Build webhook callback URL (Deepgram will automatically add dg-token header)
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const webhookUrl = `${apiBaseUrl}/api/tq/v1/webhook/deepgram`;

    // Validate webhook URL (must be HTTPS in production, HTTP only for localhost)
    if (!apiBaseUrl.startsWith('http://localhost') && !apiBaseUrl.startsWith('https://')) {
      throw new Error(`Invalid API_BASE_URL: ${apiBaseUrl}. Must use HTTPS in production or http://localhost for development.`);
    }

    console.log(`[Transcription] Starting transcription with webhook URL: ${webhookUrl}`);

    // Get tenant transcription config and plan to determine language strategy
    let detectLanguage = false;
    let transcriptionLanguage = 'en-US'; // Default for monolingual mode

    try {
      // Fetch config with plan details to check if language detection is enabled
      const configQuery = await client.query(
        `SELECT ttc.transcription_language, tp.language_detection_enabled
         FROM public.tenant_transcription_config ttc
         INNER JOIN public.transcription_plans tp ON ttc.plan_id_fk = tp.id
         WHERE ttc.tenant_id_fk = $1`,
        [tenantId]
      );

      if (configQuery.rows.length > 0) {
        const planConfig = configQuery.rows[0];
        detectLanguage = planConfig.language_detection_enabled || false;

        if (detectLanguage) {
          console.log(`[Transcription] Plan uses MULTILINGUAL mode (detect_language=true)`);
        } else {
          // Monolingual mode: determine target language
          // Priority: 1) config language, 2) timezone-based, 3) default
          if (planConfig.transcription_language) {
            transcriptionLanguage = planConfig.transcription_language;
            console.log(`[Transcription] Using config language: ${transcriptionLanguage}`);
          } else if (req.tenant?.timezone) {
            transcriptionLanguage = req.tenant.timezone === 'America/Sao_Paulo' ? 'pt-BR' : 'en-US';
            console.log(`[Transcription] Determined language from timezone ${req.tenant.timezone}: ${transcriptionLanguage}`);
          } else {
            console.log(`[Transcription] Using default language: ${transcriptionLanguage}`);
          }
          console.log(`[Transcription] Plan uses MONOLINGUAL mode (language=${transcriptionLanguage})`);
        }
      } else {
        // No config found - fallback to default monolingual
        console.warn(`[Transcription] No config found for tenant ${tenantId}, using default monolingual (en-US)`);
        if (req.tenant?.timezone) {
          transcriptionLanguage = req.tenant.timezone === 'America/Sao_Paulo' ? 'pt-BR' : 'en-US';
        }
      }
    } catch (error) {
      console.warn('[Transcription] Failed to fetch plan config, using default monolingual:', error.message);
    }

    // Start Deepgram transcription with plan-based language strategy
    console.log(`[Transcription] Starting Deepgram transcription for: ${transcriptionId}`);
    console.log(`[Transcription] Audio path: ${transcription.audio_url}`);
    console.log(`[Transcription] Using signed URL: ${isStoragePath ? 'yes' : 'no (legacy URL)'}`);
    console.log(`[Transcription] Model: ${DEFAULT_STT_MODEL}`);
    console.log(`[Transcription] Language Strategy: ${detectLanguage ? 'Multilingual (detect_language)' : `Monolingual (${transcriptionLanguage})`}`);

    const deepgramOptions = {
      model: DEFAULT_STT_MODEL, // System default: nova-3
      detectLanguage: detectLanguage, // Plan setting
      extra: {
        tenantId: tenantId,
        schema: tenantSchema,
        transcriptionId: transcriptionId
      }
    };

    // Add language parameter only for monolingual mode
    if (!detectLanguage) {
      deepgramOptions.language = transcriptionLanguage;
    }

    const transcriptionApiResult = await deepgramService.transcribeByUrl(
      audioUrlForDeepgram,
      webhookUrl,
      deepgramOptions
    );

    console.log(`[Transcription] Deepgram response received successfully`);

    // Update transcription with Deepgram request ID and status
    console.log(`[Transcription] Saving Deepgram request_id: ${transcriptionApiResult.request_id} for transcription: ${transcriptionId}`);

    const updateResult = await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET deepgram_request_id = $1,
           transcript_status = 'processing',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, deepgram_request_id`,
      [transcriptionApiResult.request_id, transcriptionId]
    );

    console.log(`[Transcription] Updated ${updateResult.rowCount} row(s), deepgram_request_id saved:`, updateResult.rows[0]);

    await client.query('COMMIT');

    res.json({
      success: true,
      transcriptionId,
      requestId: transcriptionApiResult.request_id,
      status: 'processing',
      estimatedProcessingTime: deepgramService.estimateProcessingTime(1800) // Assume 30 min audio
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Transcription] ❌ Failed to start transcription:', error);
    console.error('[Transcription] ❌ Error stack:', error.stack);

    // Provide more detailed error messages based on error type
    let errorMessage = 'Failed to start transcription';
    if (error.message.includes('Deepgram API key not configured')) {
      errorMessage = 'Deepgram service not configured. Please contact support.';
    } else if (error.message.includes('Deepgram API error')) {
      errorMessage = 'Deepgram service error. Please try again or contact support.';
    } else if (error.message.includes('audio_url')) {
      errorMessage = 'Audio file not accessible. Please try uploading again.';
    }

    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /tq/transcriptions/{transcriptionId}/status:
 *   get:
 *     tags: [TQ - Transcription]
 *     summary: Get transcription status
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get the current transcription status and results.
 *       Use this endpoint to poll for transcription completion.
 *
 *       Status values: created, uploading, uploaded, processing, completed, failed
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
 *         name: transcriptionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transcription UUID
 *     responses:
 *       200:
 *         description: Transcription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transcriptionId: { type: string }
 *                 status:
 *                   type: string
 *                   enum: [created, uploading, uploaded, processing, completed, failed]
 *                 transcript: { type: string, nullable: true }
 *                 confidenceScore: { type: number, nullable: true }
 *                 requestId: { type: string, nullable: true }
 *                 processingDuration: { type: number, nullable: true }
 *                 hasAudio: { type: boolean }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       404:
 *         description: Transcription not found
 *       500:
 *         description: Database error
 */
router.get('/:transcriptionId/status', async (req, res) => {
  const client = await db.getClient();

  try {
    const { transcriptionId } = req.params;
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header is required' });
    }

    // Use tenant schema from middleware
    const tenantSchema = req.tenant?.schema || `tenant_${tenantId}`;

    // Get transcription data
    const result = await client.query(
      `SELECT
         id,
         transcript_status,
         transcript,
         confidence_score,
         deepgram_request_id,
         processing_duration_seconds,
         audio_url,
         created_at,
         updated_at
       FROM ${tenantSchema}.transcription
       WHERE id = $1`,
      [transcriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    const transcription = result.rows[0];

    const response = {
      transcriptionId: transcription.id,
      status: transcription.transcript_status,
      transcript: transcription.transcript || null,
      confidenceScore: transcription.confidence_score || null,
      requestId: transcription.deepgram_request_id || null,
      processingDuration: transcription.processing_duration_seconds || null,
      hasAudio: !!transcription.audio_url,
      createdAt: transcription.created_at,
      updatedAt: transcription.updated_at
    };

    res.json(response);

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to get session status',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /tq/transcriptions/{transcriptionId}/mark-failed:
 *   post:
 *     tags: [TQ - Transcription]
 *     summary: Mark transcription as failed
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Manually mark a transcription as failed. This endpoint is typically
 *       called by error handling middleware or when manual intervention is required.
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
 *         name: transcriptionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transcription UUID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error_message:
 *                 type: string
 *                 description: Optional error description
 *     responses:
 *       200:
 *         description: Transcription marked as failed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 transcriptionId: { type: string }
 *                 status: { type: string, enum: [failed] }
 *                 message: { type: string }
 *       404:
 *         description: Transcription not found
 *       500:
 *         description: Database error
 */
router.post('/:transcriptionId/mark-failed', async (req, res) => {
  const client = await db.getClient();

  try {
    const { transcriptionId } = req.params;
    const { error_message } = req.body;
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header is required' });
    }

    await client.query('BEGIN');

    // Use tenant schema from middleware
    const tenantSchema = req.tenant?.schema || `tenant_${tenantId}`;

    // Mark transcription as failed
    await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET transcript_status = 'failed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [transcriptionId]
    );

    await client.query('COMMIT');

    console.log(`Transcription ${transcriptionId} marked as failed: ${error_message}`);

    res.json({
      success: true,
      transcriptionId,
      status: 'failed',
      message: 'Transcription marked as failed'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Mark failed error:', error);
    res.status(500).json({
      error: 'Failed to mark session as failed',
      details: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;