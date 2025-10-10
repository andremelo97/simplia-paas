require('dotenv').config();
const { Client } = require('pg');

/**
 * Database cleanup script
 *
 * Drops the main database (simplia_paas) completely, including all tenant schemas.
 * Use with caution - this will delete ALL data!
 */

(async () => {
  const {
    DATABASE_HOST = 'localhost',
    DATABASE_PORT = '5432',
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME = 'simplia_paas',
  } = process.env;

  if (!DATABASE_USER) {
    console.error('[db:drop] DATABASE_USER not defined in .env');
    process.exit(1);
  }

  const adminClient = new Client({
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT),
    user: DATABASE_USER,
    password: String(DATABASE_PASSWORD), // Convert to string for PostgreSQL connection
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    console.log(`[db:drop] Cleaning up database '${DATABASE_NAME}'...`);

    // First, connect to the target database to clean up tenant schemas
    const targetClient = new Client({
      host: DATABASE_HOST,
      port: Number(DATABASE_PORT),
      user: DATABASE_USER,
      password: String(DATABASE_PASSWORD),
      database: DATABASE_NAME,
    });

    try {
      await targetClient.connect();
      console.log(`[db:drop] Connected to '${DATABASE_NAME}' for schema cleanup...`);

      // Find all tenant schemas
      const tenantSchemasResult = await targetClient.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'tenant_%'
        AND schema_name NOT IN ('information_schema', 'pg_catalog', 'public')
      `);

      const tenantSchemas = tenantSchemasResult.rows.map(row => row.schema_name);

      if (tenantSchemas.length > 0) {
        console.log(`[db:drop] Found ${tenantSchemas.length} tenant schemas to clean up:`, tenantSchemas);

        // Drop each tenant schema
        for (const schemaName of tenantSchemas) {
          try {
            await targetClient.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
            console.log(`[db:drop] Dropped schema: ${schemaName}`);
          } catch (schemaError) {
            console.warn(`[db:drop] Warning: Could not drop schema ${schemaName}:`, schemaError.message);
          }
        }
      } else {
        console.log(`[db:drop] No tenant schemas found to clean up`);
      }

    } catch (cleanupError) {
      // If we can't connect to the database or it doesn't exist, that's fine
      console.log(`[db:drop] Database doesn't exist or can't connect for cleanup: ${cleanupError.message}`);
    } finally {
      await targetClient.end().catch(() => {});
    }

    // Now terminate active connections and drop the database
    console.log(`[db:drop] Dropping database '${DATABASE_NAME}'...`);

    // Terminate active connections
    await adminClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
      [DATABASE_NAME]
    );

    await adminClient.query(`DROP DATABASE IF EXISTS "${DATABASE_NAME}"`);
    console.log(`[db:drop] Database '${DATABASE_NAME}' dropped successfully`);
    process.exit(0);
  } catch (err) {
    console.error('[db:drop] Failed to drop database:', err.message);
    process.exit(1);
  } finally {
    await adminClient.end().catch(() => {});
  }
})();