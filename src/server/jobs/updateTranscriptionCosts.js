/**
 * Transcription Cost Update Cron Job
 *
 * Fetches real costs from Deepgram Management API for transcriptions
 * that were processed in the last 24 hours and updates the database.
 *
 * **Schedule:** Runs once daily at 2 AM (0 2 * * *)
 *
 * **Process:**
 * 1. Find all transcription usage records from the last 24 hours
 * 2. Fetch real cost from Deepgram Management API
 * 3. Update database with real cost (if available)
 *
 * **Why Daily:**
 * - Gives Deepgram time to process and make cost data available
 * - Processes in batch (more efficient than per-request)
 * - Doesn't block webhook response time
 */

const cron = require('node-cron');
const database = require('../infra/db/database');
const DeepgramService = require('../services/deepgram');

const deepgramService = new DeepgramService();
const DEEPGRAM_PROJECT_ID = process.env.DEEPGRAM_PROJECT_ID;

/**
 * Update transcription costs with real values from Deepgram
 * Processes all usage records from the last 24 hours
 */
async function updateTranscriptionCosts() {
  console.log('[Cron] Starting transcription cost update job...');

  if (!DEEPGRAM_PROJECT_ID) {
    console.warn('[Cron] DEEPGRAM_PROJECT_ID not configured - skipping cost update');
    return;
  }

  try {
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

    if (result.rows.length === 0) {
      console.log('[Cron] No transcription usage records found in last 24 hours');
      return;
    }

    console.log(`[Cron] Found ${result.rows.length} transcription usage records to update`);

    let totalUpdated = 0;
    let totalFailed = 0;
    let totalUnchanged = 0;

    // Process each usage record
    for (const row of result.rows) {
      try {
        const requestId = row.stt_provider_request_id;

        // Fetch real cost from Deepgram Management API
        const costData = await deepgramService.getRequestCost(DEEPGRAM_PROJECT_ID, requestId);

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
            console.log(`[Cron] ✅ Updated cost for request ${requestId}: $${currentCost.toFixed(4)} → $${realCost.toFixed(4)}`);
          } else {
            totalUnchanged++;
          }
        } else {
          totalFailed++;
          console.warn(`[Cron] ⚠️ Cost not available for request ${requestId} - keeping local calculation`);
        }

        // Small delay to avoid rate limits (50ms between requests)
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        totalFailed++;
        console.error(`[Cron] ❌ Error updating cost for record ${row.id}:`, error.message);
      }
    }

    console.log(`[Cron] Cost update complete: ${totalUpdated} updated, ${totalUnchanged} unchanged, ${totalFailed} failed`);
  } catch (error) {
    console.error('[Cron] Cost update job failed:', error);
  }
}

/**
 * Initialize cron job
 * Runs once daily at 2 AM (0 2 * * *)
 */
function initTranscriptionCostUpdateJob() {
  // Schedule: Every day at 2 AM
  cron.schedule('0 2 * * *', () => {
    updateTranscriptionCosts();
  });

  console.log('[Cron] Transcription cost update job scheduled (runs daily at 2 AM)');
}

module.exports = {
  initTranscriptionCostUpdateJob,
  updateTranscriptionCosts // Export for manual testing
};
