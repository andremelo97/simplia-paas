/**
 * Deepgram Webhook Routes (Public - No Auth Required)
 *
 * This route MUST be registered BEFORE tenant/auth middlewares because:
 * - Deepgram is an external service that cannot send x-tenant-id headers
 * - TenantId is extracted from the callback_metadata in the payload
 * - Authentication is handled via HMAC signature validation
 */

const express = require('express');
const db = require('../../../infra/db/database');
const DeepgramService = require('../../../services/deepgram');
const { TenantTranscriptionUsage } = require('../../../infra/models/TenantTranscriptionUsage');
const { DEFAULT_STT_MODEL } = require('../../../infra/constants/transcription');

const router = express.Router();
const deepgramService = new DeepgramService();

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
    // Validate dg-token header presence (Deepgram API Key Identifier)
    // NOTE: dg-token contains the API Key Identifier (UUID), not the API Key itself
    // We only validate that the header exists, as the identifier is not accessible via OAuth login
    const dgToken = req.headers['dg-token'];

    if (!dgToken) {
      console.error('[Webhook] ❌ Missing dg-token header');
      console.error('[Webhook] Available headers:', JSON.stringify(Object.keys(req.headers), null, 2));
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Security: Webhook URL is not public and callback_metadata is internal
    // The presence of dg-token header is sufficient to confirm it's from Deepgram
    console.log('[Webhook] ✅ Authenticated via dg-token header, processing webhook');

    // Parse body (may be Buffer or already parsed Object)
    let webhookData;
    if (Buffer.isBuffer(req.body)) {
      // Body is Buffer (from express.raw middleware)
      const payload = req.body.toString('utf8');
      webhookData = JSON.parse(payload);
    } else if (typeof req.body === 'object') {
      // Body already parsed by express.json() middleware
      webhookData = req.body;
    } else {
      throw new Error('Unexpected request body type');
    }

    // Extract transcription metadata from callback
    // Deepgram sends callback_metadata at root level, not inside metadata
    let transcriptionId, tenantId;
    try {
      const callbackMetadata = webhookData.callback_metadata || webhookData.metadata?.callback_metadata;

      if (!callbackMetadata) {
        console.error('[Webhook] ❌ Missing callback_metadata');
        console.error('[Webhook] Available keys:', Object.keys(webhookData));
        if (webhookData.metadata) {
          console.error('[Webhook] Metadata keys:', Object.keys(webhookData.metadata));
        }
        return res.status(400).json({ error: 'Missing callback_metadata in webhook payload' });
      }

      const metadata = typeof callbackMetadata === 'string'
        ? JSON.parse(callbackMetadata)
        : callbackMetadata;

      transcriptionId = metadata.transcriptionId;
      tenantId = metadata.tenantId;

      console.log('[Webhook] Parsed:', { transcriptionId, tenantId });
    } catch (e) {
      console.error('[Webhook] ❌ Parse error:', e.message);
      return res.status(400).json({ error: 'Invalid callback metadata' });
    }

    if (!transcriptionId || !tenantId) {
      console.error('[Webhook] Missing transcriptionId or tenantId in webhook callback');
      return res.status(400).json({ error: 'Missing transcription or tenant information' });
    }

    await client.query('BEGIN');

    // Construct tenant schema from tenantId (no middleware available)
    // Query tenants table to get subdomain for schema name
    const tenantResult = await client.query(
      'SELECT schema_name FROM public.tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`[Webhook] ❌ Tenant ${tenantId} not found`);
      return res.status(400).json({ error: 'Invalid tenant' });
    }

    const tenantSchema = tenantResult.rows[0].schema_name;
    console.log(`[Webhook] Using schema: ${tenantSchema}`);

    // Process transcription results
    const transcriptionData = deepgramService.processWebhookPayload(webhookData);

    // Update transcription with results
    const updateResult = await client.query(
      `UPDATE ${tenantSchema}.transcription
       SET transcript = $1,
           confidence_score = $2,
           word_timestamps = $3,
           processing_duration_seconds = $4,
           transcript_status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, transcript_status`,
      [
        transcriptionData.transcript,
        transcriptionData.confidence_score,
        JSON.stringify(transcriptionData.word_timestamps),
        transcriptionData.processing_duration_seconds,
        transcriptionId
      ]
    );

    console.log(`[Webhook] ✅ Updated ${updateResult.rowCount} transcription(s)`);

    await client.query('COMMIT');

    // Register transcription usage for quota tracking (async, don't block response)
    // Extract audio duration from Deepgram metadata
    const audioDurationSeconds = Math.ceil(webhookData.metadata?.duration || transcriptionData.processing_duration_seconds || 0);
    const sttProviderRequestId = webhookData.metadata?.request_id || transcriptionData.request_id;

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
    console.error('[Webhook] ❌ Processing error:', error.message);

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

module.exports = router;
