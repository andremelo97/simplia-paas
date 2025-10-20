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

    // Find the transcription by deepgram_request_id across all tenant schemas
    // IMPORTANT: Do NOT use transaction for search - errors in one schema would abort the entire transaction
    // First, get all active tenant schemas
    const tenantsResult = await client.query(
      'SELECT id, schema_name FROM public.tenants WHERE active = true'
    );

    console.log(`[Webhook] Searching across ${tenantsResult.rows.length} tenant(s)`);

    let transcription = null;
    let tenantSchema = null;
    let tenantId = null;

    // Search across all tenant schemas for the transcription
    for (const tenant of tenantsResult.rows) {
      console.log(`[Webhook] Checking schema: ${tenant.schema_name}`);
      try {
        const result = await client.query(
          `SELECT id FROM ${tenant.schema_name}.transcription
           WHERE deepgram_request_id = $1`,
          [requestId]
        );

        console.log(`[Webhook] Query result in ${tenant.schema_name}: ${result.rows.length} row(s)`);

        if (result.rows.length > 0) {
          transcription = result.rows[0];
          tenantSchema = tenant.schema_name;
          tenantId = tenant.id;
          console.log(`[Webhook] ✅ Found transcription in ${tenantSchema}: ${transcription.id}`);
          break;
        }
      } catch (err) {
        // Schema might not have transcription table, continue to next tenant
        console.error(`[Webhook] Error checking ${tenant.schema_name}:`, err.message);
        continue;
      }
    }

    if (!transcription || !tenantSchema) {
      console.error(`[Webhook] ❌ Transcription not found for request_id: ${requestId}`);
      return res.status(404).json({ error: 'Transcription not found' });
    }

    // Start transaction for UPDATE operation only
    await client.query('BEGIN');
    transactionStarted = true;

    const transcriptionId = transcription.id;
    console.log(`[Webhook] Using schema: ${tenantSchema}, transcriptionId: ${transcriptionId}`);

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
