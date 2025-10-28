/**
 * Audio File Cleanup Cron Job
 *
 * Deletes audio files older than 24 hours from Supabase Storage
 * and updates the database to reflect the deletion.
 *
 * **Schedule:** Runs once daily at 2 AM (0 2 * * *)
 *
 * **Process:**
 * 1. Find all transcriptions with audio_url older than 24 hours
 * 2. Delete audio file from Supabase Storage
 * 3. Update database: SET audio_url = NULL, audio_deleted_at = NOW()
 *
 * **Why Clean URLs:**
 * After deletion, audio_url becomes invalid/broken link - no point keeping it.
 * Setting to NULL prevents 404 errors and keeps database clean.
 *
 * **Why Daily:**
 * - Cleans up files older than 24 hours once per day
 * - Runs only once per day to minimize cloud costs
 * - Scheduled at 2 AM (low traffic period)
 */

const cron = require('node-cron');
const database = require('../infra/db/database');
const { deleteFileByUrl } = require('../services/supabaseStorage');

/**
 * Cleanup audio files older than 24 hours
 * Runs across all tenant schemas (global cleanup)
 */
async function cleanupOldAudioFiles() {
  const startTime = Date.now();
  let executionId = null;

  try {
    // Log job start
    const startResult = await database.query(`
      INSERT INTO public.job_executions (job_name, status, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id
    `, ['audio_cleanup', 'running']);

    executionId = startResult.rows[0].id;
    console.log('[Job] Starting audio cleanup job...');
    // Find all tenant schemas
    const schemasResult = await database.query(`
      SELECT schema_name
      FROM public.tenants
      WHERE active = true
    `);

    if (schemasResult.rows.length === 0) {
      console.log('[Job] No active tenants found');
      return;
    }

    let totalDeleted = 0;
    let totalFailed = 0;

    // Process each tenant schema
    for (const tenantRow of schemasResult.rows) {
      const schema = tenantRow.schema_name;

      try {
        // Check if transcription table exists (skip schemas without TQ app)
        const tableCheckQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = $1
            AND table_name = 'transcription'
          )
        `;
        const tableCheck = await database.query(tableCheckQuery, [schema]);

        if (!tableCheck.rows[0].exists) {
          continue; // Skip schemas without TQ app provisioned
        }

        // Find transcriptions with audio older than 24 hours in this tenant
        const query = `
          SELECT
            id,
            audio_url,
            created_at
          FROM ${schema}.transcription
          WHERE audio_url IS NOT NULL
            AND audio_deleted_at IS NULL
            AND created_at < NOW() - INTERVAL '24 hours'
        `;

        const result = await database.query(query);

        if (result.rows.length === 0) {
          continue; // No audios to cleanup in this tenant
        }

        console.log(`[Job] Found ${result.rows.length} audio files to delete in ${schema}`);

        // Delete each audio file
        for (const row of result.rows) {
          try {
            // Delete from Supabase
            const deleted = await deleteFileByUrl(row.audio_url);

            if (deleted) {
              // Update database - clear URL, mark as deleted, and set status to expired
              await database.query(`
                UPDATE ${schema}.transcription
                SET audio_url = NULL, audio_deleted_at = NOW(), transcript_status = 'expired'
                WHERE id = $1
              `, [row.id]);

              totalDeleted++;
              // Reduce logging to avoid rate limits
            } else {
              totalFailed++;
            }
          } catch (error) {
            totalFailed++;
            console.error(`[Job] Error deleting audio in ${schema}:`, error.message);
          }
        }
      } catch (error) {
        // Only log if it's not a "table doesn't exist" error
        if (error.code !== '42P01') {
          console.error(`[Job] Error processing schema ${schema}:`, error.message);
        }
      }
    }

    console.log(`[Job] Audio cleanup complete: ${totalDeleted} deleted, ${totalFailed} failed`);

    // Log job success
    await database.query(`
      UPDATE public.job_executions
      SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
      WHERE id = $4
    `, ['success', Date.now() - startTime, JSON.stringify({ deleted: totalDeleted, failed: totalFailed }), executionId]);

  } catch (error) {
    console.error('[Job] Audio cleanup job failed:', error);

    // Log job failure
    if (executionId) {
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, error_message = $3
        WHERE id = $4
      `, ['failed', Date.now() - startTime, error.message, executionId]);
    }
  }
}

/**
 * Initialize cron job
 * Runs once daily at 2 AM (0 2 * * *)
 */
function initAudioCleanupJob() {
  // Schedule: Every day at 2 AM
  cron.schedule('0 2 * * *', () => {
    cleanupOldAudioFiles();
  });

  console.log('[Cron] Audio cleanup job scheduled (runs daily at 2 AM)');
}

module.exports = {
  initAudioCleanupJob,
  cleanupOldAudioFiles // Export for manual testing
};
