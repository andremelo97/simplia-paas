/**
 * Audio File Cleanup Cron Job
 *
 * Automatically deletes audio files older than 24 hours from Supabase Storage
 * and updates the database to reflect the deletion.
 *
 * **Schedule:** Runs every hour (0 * * * *)
 *
 * **Process:**
 * 1. Find all transcriptions with audio_url older than 24 hours
 * 2. Delete audio file from Supabase Storage
 * 3. Update database: SET audio_url = NULL, audio_deleted_at = NOW()
 *
 * **Why Clean URLs:**
 * After deletion, audio_url becomes invalid/broken link - no point keeping it.
 * Setting to NULL prevents 404 errors and keeps database clean.
 */

const cron = require('node-cron');
const database = require('../infra/db/database');
const { deleteFileByUrl } = require('../services/supabaseStorage');

/**
 * Cleanup audio files older than 24 hours
 * Runs across all tenant schemas (global cleanup)
 */
async function cleanupOldAudioFiles() {
  console.log('[Cron] Starting audio cleanup job...');

  try {
    // Find all tenant schemas
    const schemasResult = await database.query(`
      SELECT schema_name
      FROM public.tenants
      WHERE active = true
    `);

    if (schemasResult.rows.length === 0) {
      console.log('[Cron] No active tenants found');
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

        console.log(`[Cron] Found ${result.rows.length} audio files to delete in ${schema}`);

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
            console.error(`[Cron] Error deleting audio in ${schema}:`, error.message);
          }
        }
      } catch (error) {
        // Only log if it's not a "table doesn't exist" error
        if (error.code !== '42P01') {
          console.error(`[Cron] Error processing schema ${schema}:`, error.message);
        }
      }
    }

    console.log(`[Cron] Audio cleanup complete: ${totalDeleted} deleted, ${totalFailed} failed`);
  } catch (error) {
    console.error('[Cron] Audio cleanup job failed:', error);
  }
}

/**
 * Initialize cron job
 * Runs every hour at minute 0 (0 * * * *)
 */
function initAudioCleanupJob() {
  // Schedule: Every hour
  cron.schedule('0 * * * *', () => {
    cleanupOldAudioFiles();
  });

  console.log('[Cron] Audio cleanup job scheduled (runs every hour)');
}

module.exports = {
  initAudioCleanupJob,
  cleanupOldAudioFiles // Export for manual testing
};
