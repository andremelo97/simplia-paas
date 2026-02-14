const cron = require('node-cron');
const database = require('../infra/db/database');

/**
 * Cron job to expire landing pages
 * Runs every hour and deactivates expired landing pages across all tenant schemas
 *
 * IMPORTANT: This job checks expires_at timestamp against CURRENT_TIMESTAMP (UTC).
 * Frontend sends expires_at as ISO timestamp (e.g., "2025-10-30T21:39:50.995Z"),
 * which preserves the exact moment of expiration (current time + N days).
 * PostgreSQL compares both timestamps in UTC, so expiration is timezone-agnostic.
 */
async function expireLandingPages() {
  const startTime = Date.now();
  let executionId = null;

  try {
    console.log('[Expire Landing Pages] Starting expiration check...');

    // Log job start
    const startResult = await database.query(`
      INSERT INTO public.job_executions (job_name, status, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id
    `, ['expire_landing_pages', 'running']);

    executionId = startResult.rows[0].id;
    console.log(`[Expire Landing Pages] Execution ID: ${executionId}`);

    // Query all active tenant schemas
    const schemasResult = await database.query(`
      SELECT schema_name, timezone
      FROM public.tenants
      WHERE active = true AND status = 'active'
    `);

    const schemas = schemasResult.rows;

    if (schemas.length === 0) {
      console.log('[Expire Landing Pages] No active tenants found');

      // Update execution as success with 0 expirations
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
        WHERE id = $4
      `, ['success', Date.now() - startTime, JSON.stringify({ expired: 0, schemas_processed: 0 }), executionId]);

      console.log(`[Expire Landing Pages] Execution logged to database (ID: ${executionId})`);
      return;
    }

    console.log(`[Expire Landing Pages] Processing ${schemas.length} tenant schemas...`);

    let totalExpired = 0;

    for (const { schema_name, timezone } of schemas) {
      try {
        // Find expired landing pages that are still active
        // expires_at < CURRENT_TIMESTAMP means the link has passed its expiration date
        const result = await database.query(`
          UPDATE ${schema_name}.landing_page
          SET active = false, updated_at = CURRENT_TIMESTAMP
          WHERE active = true
            AND expires_at IS NOT NULL
            AND expires_at < CURRENT_TIMESTAMP
          RETURNING id, expires_at
        `);

        if (result.rowCount > 0) {
          console.log(`[Expire Landing Pages] Expired ${result.rowCount} landing page(s) in ${schema_name} (timezone: ${timezone})`);
          totalExpired += result.rowCount;

          // Log details for debugging
          result.rows.forEach(row => {
            console.log(`   - Landing Page ID: ${row.id}, Expired At: ${row.expires_at}`);
          });
        }
      } catch (schemaError) {
        console.error(`[Expire Landing Pages] Failed to process schema ${schema_name}:`, schemaError.message);
      }
    }

    if (totalExpired > 0) {
      console.log(`[Expire Landing Pages] Completed. Total expired: ${totalExpired}`);
    } else {
      console.log(`[Expire Landing Pages] Completed. No expired landing pages found.`);
    }

    // Log job success
    await database.query(`
      UPDATE public.job_executions
      SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
      WHERE id = $4
    `, ['success', Date.now() - startTime, JSON.stringify({ expired: totalExpired, schemas_processed: schemas.length }), executionId]);

    console.log(`[Expire Landing Pages] Execution logged to database (ID: ${executionId})`);

  } catch (error) {
    console.error('[Expire Landing Pages] Job failed:', error);

    // Log job failure
    if (executionId) {
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, error_message = $3
        WHERE id = $4
      `, ['failed', Date.now() - startTime, error.message, executionId]);

      console.log(`[Expire Landing Pages] Failure logged to database (ID: ${executionId})`);
    }
  }
}

/**
 * Initialize the landing page expiration cron job
 * Runs every hour at minute 0
 *
 * Cron expression: '0 * * * *'
 * - Minute: 0
 * - Hour: * (every hour)
 * - Day of Month: * (every day)
 * - Month: * (every month)
 * - Day of Week: * (every day of week)
 *
 * Examples:
 * - 00:00 (midnight)
 * - 01:00
 * - 02:00
 * - ...
 * - 23:00
 */
function initExpireLandingPagesJob() {
  const cronExpression = '0 * * * *';  // Every hour at minute 0

  console.log(`[Expire Landing Pages] Attempting to schedule with expression: '${cronExpression}'`);

  try {
    const task = cron.schedule(cronExpression, () => {
      console.log('[Expire Landing Pages] Cron callback triggered!');
      expireLandingPages();
    }, {
      scheduled: true,
      timezone: "UTC"  // Explicitly set timezone to UTC
    });

    console.log(`[Expire Landing Pages] Cron job scheduled successfully`);
    console.log(`[Expire Landing Pages] Schedule: Every hour at minute 0 (UTC)`);
    console.log(`[Expire Landing Pages] Timezone: UTC`);
    console.log(`[Expire Landing Pages] Task object: ${task ? 'EXISTS' : 'NULL'}`);

  } catch (error) {
    console.error('[Expire Landing Pages] Failed to schedule cron job:', error);
  }
}

module.exports = { initExpireLandingPagesJob, expireLandingPages };
