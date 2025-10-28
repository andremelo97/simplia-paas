/**
 * Audio File Cleanup Cron Job
 *
 * Deletes audio files older than 24 hours from Supabase Storage
 * and updates the database to reflect the deletion.
 *
 * **Schedule:** Runs hourly (0 * * * *)
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
 * **Why Hourly:**
 * - Ensures files are deleted within 24 hours of creation
 * - Prevents files from exceeding the 24-hour threshold
 * - Runs at the top of every hour
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
    console.log('🧹 [Audio Cleanup Job] Starting audio cleanup job...');

    // Log job start
    const startResult = await database.query(`
      INSERT INTO public.job_executions (job_name, status, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id
    `, ['audio_cleanup', 'running']);

    executionId = startResult.rows[0].id;
    console.log(`📝 [Audio Cleanup Job] Execution ID: ${executionId}`);

    // Find all tenant schemas
    const schemasResult = await database.query(`
      SELECT schema_name
      FROM public.tenants
      WHERE active = true
    `);

    console.log(`🏢 [Audio Cleanup Job] Found ${schemasResult.rows.length} active tenants`);

    if (schemasResult.rows.length === 0) {
      console.log('⚠️  [Audio Cleanup Job] No active tenants found');
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
          console.log(`⏭️  [Audio Cleanup Job] Skipping ${schema} (no transcription table)`);
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
          console.log(`✅ [Audio Cleanup Job] ${schema}: No files to cleanup`);
          continue; // No audios to cleanup in this tenant
        }

        console.log(`🗑️  [Audio Cleanup Job] ${schema}: Found ${result.rows.length} files to delete`);

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
              console.log(`   ✓ Deleted file from ${schema} (ID: ${row.id})`);
            } else {
              totalFailed++;
              console.log(`   ✗ Failed to delete file from ${schema} (ID: ${row.id})`);
            }
          } catch (error) {
            totalFailed++;
            console.error(`   ❌ Error deleting audio in ${schema} (ID: ${row.id}):`, error.message);
          }
        }
      } catch (error) {
        // Only log if it's not a "table doesn't exist" error
        if (error.code !== '42P01') {
          console.error(`❌ [Audio Cleanup Job] Error processing schema ${schema}:`, error.message);
        }
      }
    }

    console.log(`✅ [Audio Cleanup Job] Complete: ${totalDeleted} deleted, ${totalFailed} failed (Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s)`);

    // Log job success
    await database.query(`
      UPDATE public.job_executions
      SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
      WHERE id = $4
    `, ['success', Date.now() - startTime, JSON.stringify({ deleted: totalDeleted, failed: totalFailed }), executionId]);

    console.log(`💾 [Audio Cleanup Job] Execution logged to database (ID: ${executionId})`);

  } catch (error) {
    console.error('❌ [Audio Cleanup Job] Job failed:', error);

    // Log job failure
    if (executionId) {
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, error_message = $3
        WHERE id = $4
      `, ['failed', Date.now() - startTime, error.message, executionId]);

      console.log(`💾 [Audio Cleanup Job] Failure logged to database (ID: ${executionId})`);
    }
  }
}

/**
 * Initialize cron job
 * Runs hourly (0 * * * *)
 */
function initAudioCleanupJob() {
  // Schedule: Every hour at minute 0
  cron.schedule('0 * * * *', () => {
    cleanupOldAudioFiles();
  });

  console.log('[Cron] Audio cleanup job scheduled (runs hourly)');
}

module.exports = {
  initAudioCleanupJob,
  cleanupOldAudioFiles // Export for manual testing
};
