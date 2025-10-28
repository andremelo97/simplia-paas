/**
 * Transcription Cost Update Cron Job
 *
 * Fetches real costs from Deepgram Management API for transcriptions
 * that were processed in the last 24 hours and updates the database.
 *
 * **Schedule:** Runs once daily at 3 AM (0 3 * * *)
 *
 * **Process:**
 * 1. Find all transcription usage records from the last 24 hours
 * 2. Extract project ID from request_id (format: {project_id}.{unique_id})
 * 3. Fetch real cost from Deepgram Management API
 * 4. Update database with real cost (if available)
 *
 * **Why Daily:**
 * - Gives Deepgram time to process and make cost data available
 * - Processes in batch (more efficient than per-request)
 * - Doesn't block webhook response time
 * - Runs only once per day to minimize cloud costs
 */

const cron = require('node-cron');
const database = require('../infra/db/database');
const DeepgramService = require('../services/deepgram');

const deepgramService = new DeepgramService();

/**
 * Extract project ID from Deepgram request ID
 * Request IDs have format: {project_id}.{unique_id}
 * Example: "abc123def-456-789.xyz987-654-321" → "abc123def-456-789"
 */
function extractProjectIdFromRequestId(requestId) {
  if (!requestId || typeof requestId !== 'string') {
    return null;
  }

  const parts = requestId.split('.');
  return parts.length >= 2 ? parts[0] : null;
}

/**
 * Update transcription costs with real values from Deepgram
 * Processes all usage records from the last 24 hours
 */
async function updateTranscriptionCosts() {
  const startTime = Date.now();
  let executionId = null;

  try {
    console.log('💰 [Cost Update Job] Starting transcription cost update job...');

    // Log job start
    const startResult = await database.query(`
      INSERT INTO public.job_executions (job_name, status, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id
    `, ['cost_update', 'running']);

    executionId = startResult.rows[0].id;
    console.log(`📝 [Cost Update Job] Execution ID: ${executionId}`);

    if (!deepgramService.apiKey) {
      console.warn('⚠️  [Cost Update Job] DEEPGRAM_API_KEY not configured - skipping cost update');

      // Update execution as failed
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, error_message = $3
        WHERE id = $4
      `, ['failed', Date.now() - startTime, 'DEEPGRAM_API_KEY not configured', executionId]);

      console.log('💾 [Cost Update Job] Failure logged to database (ID: ${executionId})');
      return;
    }

    // Find all usage records from last 24 hours with request_id
    const query = `
      SELECT
        id,
        stt_provider_request_id,
        cost_usd as current_cost,
        audio_duration_seconds,
        detected_language
      FROM public.tenant_transcription_usage
      WHERE stt_provider_request_id IS NOT NULL
        AND usage_date >= NOW() - INTERVAL '24 hours'
      ORDER BY usage_date DESC
    `;

    const result = await database.query(query);

    console.log(`📊 [Cost Update Job] Found ${result.rows.length} usage records from last 24 hours`);

    if (result.rows.length === 0) {
      console.log('✅ [Cost Update Job] No records to process');

      // Update execution as success with 0 updates
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
        WHERE id = $4
      `, ['success', Date.now() - startTime, JSON.stringify({ updated: 0, unchanged: 0, skipped: 0, failed: 0 }), executionId]);

      console.log(`💾 [Cost Update Job] Execution logged to database (ID: ${executionId})`);
      return;
    }

    let totalUpdated = 0;
    let totalFailed = 0;
    let totalUnchanged = 0;
    let totalSkipped = 0;

    // Process each usage record
    for (const row of result.rows) {
      try {
        const requestId = row.stt_provider_request_id;

        // Extract project ID from request_id
        const projectId = extractProjectIdFromRequestId(requestId);

        if (!projectId) {
          totalSkipped++;
          console.warn(`   ⚠️  Could not extract project ID from request ${requestId} - skipping`);
          continue;
        }

        // Fetch real cost from Deepgram Management API
        const costData = await deepgramService.getRequestCost(projectId, requestId);

        if (costData.usd !== null) {
          const realCost = costData.usd;
          const currentCost = parseFloat(row.current_cost);

          // Only update if cost changed significantly (more than $0.0001 difference)
          if (Math.abs(realCost - currentCost) > 0.0001) {
            await database.query(`
              UPDATE public.tenant_transcription_usage
              SET cost_usd = $1, updated_at = NOW()
              WHERE id = $2
            `, [realCost.toFixed(4), row.id]);

            totalUpdated++;
            console.log(`   ✓ Updated cost for request ${requestId}: $${currentCost.toFixed(4)} → $${realCost.toFixed(4)}`);
          } else {
            totalUnchanged++;
          }
        } else {
          totalFailed++;
          console.warn(`   ✗ Cost not available for request ${requestId} - keeping local calculation`);
        }

        // Small delay to avoid rate limits (50ms between requests)
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        totalFailed++;
        console.error(`   ❌ Error updating cost for record ${row.id}:`, error.message);
      }
    }

    console.log(`✅ [Cost Update Job] Complete: ${totalUpdated} updated, ${totalUnchanged} unchanged, ${totalSkipped} skipped, ${totalFailed} failed (Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

    // Log job success
    await database.query(`
      UPDATE public.job_executions
      SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
      WHERE id = $4
    `, ['success', Date.now() - startTime, JSON.stringify({ updated: totalUpdated, unchanged: totalUnchanged, skipped: totalSkipped, failed: totalFailed }), executionId]);

    console.log(`💾 [Cost Update Job] Execution logged to database (ID: ${executionId})`);

  } catch (error) {
    console.error('❌ [Cost Update Job] Job failed:', error);

    // Log job failure
    if (executionId) {
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, error_message = $3
        WHERE id = $4
      `, ['failed', Date.now() - startTime, error.message, executionId]);

      console.log(`💾 [Cost Update Job] Failure logged to database (ID: ${executionId})`);
    }
  }
}

/**
 * Initialize cron job
 * Runs once daily at 3 AM (0 3 * * *)
 */
function initTranscriptionCostUpdateJob() {
  // Schedule: Every day at 3 AM
  cron.schedule('0 3 * * *', () => {
    updateTranscriptionCosts();
  });

  console.log('[Cron] Transcription cost update job scheduled (runs daily at 3 AM)');
}

module.exports = {
  initTranscriptionCostUpdateJob,
  updateTranscriptionCosts // Export for manual testing
};
