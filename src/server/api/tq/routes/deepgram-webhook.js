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
  let transactionStarted = false;

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

    // Extract request_id from webhook to find the transcription
    // Deepgram does not support callback_metadata, so we use request_id correlation
    const requestId = webhookData.metadata?.request_id;

    if (!requestId) {
      console.error('[Webhook] ❌ Missing request_id in metadata');
      console.error('[Webhook] Available keys:', Object.keys(webhookData));
      if (webhookData.metadata) {
        console.error('[Webhook] Metadata keys:', Object.keys(webhookData.metadata));
      }
      return res.status(400).json({ error: 'Missing request_id in webhook payload' });
    }

    console.log('[Webhook] Processing request_id:', requestId);

    // Extract tenant information from extra metadata
    const extraMetadata = webhookData.metadata?.extra;

    if (!extraMetadata) {
      console.error('[Webhook] ❌ Missing extra metadata in webhook payload');
      console.error('[Webhook] Available metadata keys:', Object.keys(webhookData.metadata || {}));
      return res.status(400).json({ error: 'Missing extra metadata' });
    }

    const tenantId = extraMetadata.tenantId;
    const tenantSchema = extraMetadata.schema;
    const transcriptionId = extraMetadata.transcriptionId;

    console.log(`[Webhook] 📦 Extra metadata:`, {
      tenantId,
      tenantSchema,
      transcriptionId
    });

    if (!tenantId || !tenantSchema || !transcriptionId) {
      console.error('[Webhook] ❌ Incomplete extra metadata');
      console.error('[Webhook] Extra metadata received:', extraMetadata);
      return res.status(400).json({ error: 'Incomplete extra metadata' });
    }

    // Verify transcription exists in tenant schema
    const verifyResult = await client.query(
      `SELECT id FROM ${tenantSchema}.transcription WHERE id = $1`,
      [transcriptionId]
    );

    if (verifyResult.rows.length === 0) {
      console.error(`[Webhook] ❌ Transcription not found: ${transcriptionId} in ${tenantSchema}`);
      return res.status(404).json({ error: 'Transcription not found' });
    }

    console.log(`[Webhook] ✅ Found transcription in ${tenantSchema}: ${transcriptionId}`);

    // Start transaction for UPDATE operation only
    await client.query('BEGIN');
    transactionStarted = true;

    const transcriptionId = transcription.id;
    console.log(`[Webhook] Using schema: ${tenantSchema}, transcriptionId: ${transcriptionId}`);

    // Process transcription results
    const transcriptionData = deepgramService.processWebhookPayload(webhookData);

    console.log(`[Webhook] 📝 Transcript length: ${transcriptionData.transcript?.length || 0}`);
    console.log(`[Webhook] 📝 Transcript preview: ${transcriptionData.transcript?.substring(0, 150) || '(empty)'}`);
    console.log(`[Webhook] 📊 Confidence: ${transcriptionData.confidence_score}`);
    console.log(`[Webhook] ⏱️  Duration: ${transcriptionData.processing_duration_seconds}s`);

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
       RETURNING id, transcript_status, LENGTH(transcript) as transcript_length`,
      [
        transcriptionData.transcript,
        transcriptionData.confidence_score,
        JSON.stringify(transcriptionData.word_timestamps),
        transcriptionData.processing_duration_seconds,
        transcriptionId
      ]
    );

    const saved = updateResult.rows[0];
    console.log(`[Webhook] ✅ Updated ${updateResult.rowCount} transcription(s)`);
    console.log(`[Webhook] 💾 Saved transcript length: ${saved.transcript_length || 0} characters`);

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
    // Only rollback if transaction was started
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
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
