const cron = require('node-cron');
const database = require('../infra/db/database');

/**
 * Cron job to expire public quotes
 * Runs every hour and deactivates expired public quotes across all tenant schemas
 *
 * IMPORTANT: This job checks expires_at timestamp against CURRENT_TIMESTAMP (UTC).
 * Frontend sends expires_at as ISO timestamp (e.g., "2025-10-30T21:39:50.995Z"),
 * which preserves the exact moment of expiration (current time + N days).
 * PostgreSQL compares both timestamps in UTC, so expiration is timezone-agnostic.
 */
async function expirePublicQuotes() {
  console.log('🕒 [Expire Public Quotes] Starting expiration check...');

  try {
    // Query all active tenant schemas
    const schemasResult = await database.query(`
      SELECT schema_name, timezone
      FROM public.tenants
      WHERE active = true AND status = 'active'
    `);

    const schemas = schemasResult.rows;

    if (schemas.length === 0) {
      console.log('⚠️  [Expire Public Quotes] No active tenants found');
      return;
    }

    console.log(`📊 [Expire Public Quotes] Processing ${schemas.length} tenant schemas...`);

    let totalExpired = 0;

    for (const { schema_name, timezone } of schemas) {
      try {
        // Find expired public quotes that are still active
        // expires_at < CURRENT_TIMESTAMP means the link has passed its expiration date
        const result = await database.query(`
          UPDATE ${schema_name}.public_quote
          SET active = false, updated_at = CURRENT_TIMESTAMP
          WHERE active = true
            AND expires_at IS NOT NULL
            AND expires_at < CURRENT_TIMESTAMP
          RETURNING id, expires_at
        `);

        if (result.rowCount > 0) {
          console.log(`✅ [Expire Public Quotes] Expired ${result.rowCount} quote(s) in ${schema_name} (timezone: ${timezone})`);
          totalExpired += result.rowCount;

          // Log details for debugging
          result.rows.forEach(row => {
            console.log(`   - Public Quote ID: ${row.id}, Expired At: ${row.expires_at}`);
          });
        }
      } catch (schemaError) {
        console.error(`❌ [Expire Public Quotes] Failed to process schema ${schema_name}:`, schemaError.message);
      }
    }

    if (totalExpired > 0) {
      console.log(`🏁 [Expire Public Quotes] Completed. Total expired: ${totalExpired}`);
    } else {
      console.log(`🏁 [Expire Public Quotes] Completed. No expired quotes found.`);
    }
  } catch (error) {
    console.error('❌ [Expire Public Quotes] Job failed:', error);
  }
}

/**
 * Initialize the public quote expiration cron job
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
function initExpirePublicQuotesJob() {
  const cronExpression = '0 * * * *';  // Every hour at minute 0

  console.log(`⏰ [Expire Public Quotes] Attempting to schedule with expression: '${cronExpression}'`);

  try {
    const task = cron.schedule(cronExpression, () => {
      console.log('🔔 [Expire Public Quotes] Cron callback triggered!');
      expirePublicQuotes();
    }, {
      scheduled: true,
      timezone: "UTC"  // Explicitly set timezone to UTC
    });

    console.log(`✅ [Expire Public Quotes] Cron job scheduled successfully`);
    console.log(`📅 [Expire Public Quotes] Schedule: Every hour at minute 0 (UTC)`);
    console.log(`🌍 [Expire Public Quotes] Timezone: UTC`);
    console.log(`⚙️  [Expire Public Quotes] Task object: ${task ? 'EXISTS' : 'NULL'}`);

  } catch (error) {
    console.error('❌ [Expire Public Quotes] Failed to schedule cron job:', error);
  }
}

module.exports = { initExpirePublicQuotesJob, expirePublicQuotes };
