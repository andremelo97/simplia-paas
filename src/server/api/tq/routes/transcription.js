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

    console.log('🔍 [DEBUG] About to upload to Supabase Storage');

    // Upload to tenant-specific Supabase Storage bucket
    const tenantSubdomain = req.tenant?.slug;
    if (!tenantSubdomain) {
      throw new Error('Tenant subdomain not found in request context');
    }

    const storageService = getTenantStorageService(tenantSubdomain);
    await storageService.ensureBucketExists();
    console.log('🔍 [DEBUG] Storage bucket verified');

    // Upload to Supabase using transcriptionId as filename
    const uploadResult = await storageService.uploadFile(
      fileBuffer,
      fileName,
      transcriptionId, // Use transcription ID instead of session ID
      'audio-files', // Folder within tenant bucket
      mimeType
    );
    console.log('🔍 [DEBUG] File uploaded to storage:', uploadResult);

    // Update transcription with audio URL and status
    await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET audio_url = $1,
           transcript_status = 'uploaded',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [uploadResult.url, transcriptionId]
    );
    console.log('🔍 [DEBUG] Database updated with upload info');

    await client.query('COMMIT');
    console.log('🔍 [DEBUG] Transaction committed');

    console.log(`Audio uploaded for transcription ${transcriptionId}: ${fileName} (${uploadResult.size} bytes) to ${uploadResult.path}`);

    const response = {
      success: true,
      transcriptionId,
      audioUrl: uploadResult.url,
      fileName,
      fileSize: uploadResult.size,
      storagePath: uploadResult.path,
      status: 'uploaded'
    };

    console.log('🔍 [DEBUG] Sending upload response:', response);

    res.json(response);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Audio upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB' });
    }

    res.status(500).json({
      error: 'Failed to upload audio file',
      details: error.message
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

    // Build webhook callback URL - webhook should go to TQ API server
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const webhookUrl = `${apiBaseUrl}/api/tq/v1/transcriptions/webhook/deepgram`;

    console.log(`[Transcription] Starting transcription with webhook URL: ${webhookUrl}`);

    // Validate webhook URL (must be HTTPS in production, HTTP only for localhost)
    if (!apiBaseUrl.startsWith('http://localhost') && !apiBaseUrl.startsWith('https://')) {
      throw new Error(`Invalid API_BASE_URL: ${apiBaseUrl}. Must use HTTPS in production or http://localhost for development.`);
    }

    // Determine language for transcription
    // Priority: 1) tenant config, 2) tenant locale, 3) default (pt-BR)
    let transcriptionLanguage = DEFAULT_LANGUAGE;

    try {
      // Try to get language from tenant transcription config
      const configQuery = await client.query(
        'SELECT transcription_language FROM public.tenant_transcription_config WHERE tenant_id_fk = $1',
        [tenantId]
      );

      if (configQuery.rows.length > 0 && configQuery.rows[0].transcription_language) {
        transcriptionLanguage = configQuery.rows[0].transcription_language;
      } else if (req.tenant?.locale) {
        // Fall back to tenant locale from JWT/context
        transcriptionLanguage = LOCALE_TO_DEEPGRAM_LANGUAGE[req.tenant.locale] || DEFAULT_LANGUAGE;
      }
    } catch (error) {
      console.warn('[Transcription] Failed to determine language, using default:', error.message);
    }

    // Start Deepgram transcription with language targeting
    const transcriptionApiResult = await deepgramService.transcribeByUrl(
      transcription.audio_url,
      webhookUrl,
      {
        model: DEFAULT_STT_MODEL, // System default: Nova-3
        language: transcriptionLanguage, // pt-BR or en-US
        additionalParams: {
          // Add transcription metadata to callback
          callback_metadata: JSON.stringify({
            transcriptionId,
            tenantId
          })
        }
      }
    );

    // Update transcription with Deepgram request ID and status
    await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET deepgram_request_id = $1,
           transcript_status = 'processing',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [transcriptionApiResult.request_id, transcriptionId]
    );

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
    console.error('Transcription start error:', error);
    res.status(500).json({
      error: 'Failed to start transcription',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /tq/webhook/deepgram:
 *   post:
 *     tags: [TQ - Transcription]
 *     summary: Deepgram webhook callback endpoint
 *     description: |
 *       **Scope:** Public (no authentication required)
 *
 *       Internal webhook endpoint for Deepgram to deliver transcription results.
 *       This endpoint validates HMAC signatures and processes completed transcriptions.
 *
 *       **Note:** This endpoint is called automatically by Deepgram and should not be used directly.
 *     parameters:
 *       - in: header
 *         name: x-deepgram-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC signature for webhook validation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Deepgram webhook payload with transcription results
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       401:
 *         description: Invalid webhook signature
 *       400:
 *         description: Invalid payload or missing session information
 */
router.post('/webhook/deepgram', express.raw({ type: 'application/json' }), async (req, res) => {
  const client = await db.getClient();

  try {
    const signature = req.headers['x-deepgram-signature'];
    const payload = req.body.toString('utf8');

    console.log('[Webhook] Received Deepgram webhook');

    // Validate webhook signature
    if (!deepgramService.validateWebhookSignature(payload, signature)) {
      console.error('[Webhook] Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = JSON.parse(payload);
    console.log('[Webhook] Webhook payload keys:', Object.keys(webhookData));

    // Extract transcription metadata from callback
    // Deepgram sends callback_metadata at root level, not inside metadata
    let transcriptionId, tenantId;
    try {
      const callbackMetadata = webhookData.callback_metadata || webhookData.metadata?.callback_metadata;

      if (!callbackMetadata) {
        console.error('[Webhook] callback_metadata not found in payload');
        return res.status(400).json({ error: 'Missing callback_metadata in webhook payload' });
      }

      const metadata = typeof callbackMetadata === 'string'
        ? JSON.parse(callbackMetadata)
        : callbackMetadata;

      transcriptionId = metadata.transcriptionId;
      tenantId = metadata.tenantId;

      console.log('[Webhook] Extracted metadata:', { transcriptionId, tenantId });
    } catch (e) {
      console.error('[Webhook] Failed to parse callback metadata:', e);
      return res.status(400).json({ error: 'Invalid callback metadata' });
    }

    if (!transcriptionId || !tenantId) {
      console.error('[Webhook] Missing transcriptionId or tenantId in webhook callback');
      return res.status(400).json({ error: 'Missing transcription or tenant information' });
    }

    await client.query('BEGIN');

    // Use tenant schema from middleware
    const tenantSchema = req.tenant?.schema || `tenant_${tenantId}`;

    // Process transcription results
    const transcriptionData = deepgramService.processWebhookPayload(webhookData);

    // Update transcription with results
    await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET transcript = $1,
           confidence_score = $2,
           word_timestamps = $3,
           processing_duration_seconds = $4,
           transcript_status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        transcriptionData.transcript,
        transcriptionData.confidence_score,
        JSON.stringify(transcriptionData.word_timestamps),
        transcriptionData.processing_duration_seconds,
        transcriptionId
      ]
    );

    await client.query('COMMIT');

    console.log(`Transcription completed for transcription ${transcriptionId} (tenant: ${tenantId})`);

    // Register transcription usage for quota tracking (async, don't block response)
    // Extract audio duration from Deepgram metadata
    const audioDurationSeconds = Math.ceil(webhookData.metadata?.duration || transcriptionData.processing_duration_seconds || 0);
    const sttProviderRequestId = webhookData.metadata?.request_id || transcriptionData.request_id;

    // Import usage model and constants
    const { TenantTranscriptionUsage } = require('../../../infra/models/TenantTranscriptionUsage');
    const { DEFAULT_STT_MODEL } = require('../../../infra/constants/transcription');

    // Record usage with cost calculation (fire and forget)
    TenantTranscriptionUsage.create(parseInt(tenantId), {
      transcriptionId: transcriptionId,
      audioDurationSeconds: audioDurationSeconds,
      sttModel: DEFAULT_STT_MODEL, // Use system default model (nova-3)
      sttProviderRequestId: sttProviderRequestId,
      usageDate: new Date()
    }).catch(error => {
      console.error(`[Transcription Usage] Failed to record usage for transcription ${transcriptionId}:`, error);
    });

    res.json({ success: true, message: 'Transcription processed successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Webhook processing error:', error);

    // For webhook errors, still return 200 to avoid Deepgram retries
    res.status(200).json({
      success: false,
      error: 'Failed to process transcription results',
      details: error.message
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

    res.json({
      transcriptionId: transcription.id,
      status: transcription.transcript_status,
      transcript: transcription.transcript || null,
      confidenceScore: transcription.confidence_score || null,
      requestId: transcription.deepgram_request_id || null,
      processingDuration: transcription.processing_duration_seconds || null,
      hasAudio: !!transcription.audio_url,
      createdAt: transcription.created_at,
      updatedAt: transcription.updated_at
    });

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