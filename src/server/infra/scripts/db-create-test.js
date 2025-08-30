require('dotenv').config();
const { Client } = require('pg');

/**
 * Automatic test database creation script
 * 
 * This script runs before tests to ensure the test database exists.
 * In development environments without PostgreSQL, this will warn but continue.
 * In CI/CD environments, ensure PostgreSQL is available and credentials are correct.
 */

(async () => {
  const {
    DATABASE_HOST = 'localhost',
    DATABASE_PORT = '5432',
    DATABASE_USER,
    DATABASE_PASSWORD,
    TEST_DATABASE_NAME = 'simplia_paas_test',
  } = process.env;

  if (!DATABASE_USER) {
    console.error('[db:create:test] DATABASE_USER not defined in .env');
    process.exit(1);
  }

  if (!TEST_DATABASE_NAME) {
    console.error('[db:create:test] TEST_DATABASE_NAME not defined in .env');
    process.exit(1);
  }

  const adminDatabase = 'postgres'; // Safe admin database to connect to
  const adminClient = new Client({
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT),
    user: DATABASE_USER,
    password: String(DATABASE_PASSWORD), // Convert to string for PostgreSQL connection
    database: adminDatabase,
  });

  try {
    await adminClient.connect();

    // Check if database already exists
    const existsRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TEST_DATABASE_NAME]
    );

    if (existsRes.rowCount > 0) {
      console.log(`[db:create:test] Database '${TEST_DATABASE_NAME}' already exists — ok`);
      process.exit(0);
    }

    // Create database (idempotent)
    console.log(`[db:create:test] Creating database '${TEST_DATABASE_NAME}'...`);
    // encoding/template are good practices; adjust collation if needed for your environment
    await adminClient.query(
      `CREATE DATABASE "${TEST_DATABASE_NAME}" WITH TEMPLATE template0 ENCODING 'UTF8'`
    );

    // Optional: set owner to the same user
    try {
      await adminClient.query(
        `ALTER DATABASE "${TEST_DATABASE_NAME}" OWNER TO "${DATABASE_USER}"`
      );
    } catch (e) {
      // Depending on provider/role this might fail — just log warning
      console.warn(`[db:create:test] Warning: could not alter OWNER: ${e.message}`);
    }

    console.log(`[db:create:test] Database '${TEST_DATABASE_NAME}' created successfully`);
    process.exit(0);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn('[db:create:test] ⚠️  PostgreSQL is not running or inaccessible');
      console.warn('[db:create:test] For local development, make sure:');
      console.warn('[db:create:test] 1. PostgreSQL is installed and running');
      console.warn('[db:create:test] 2. Credentials in .env are correct');
      console.warn('[db:create:test] 3. User has permission to create databases');
      console.warn('[db:create:test] Continuing anyway (tests may fail)...');
      process.exit(0); // Exit gracefully to allow tests to run (they will fail if needed)
    }

    console.error('[db:create:test] Failed to create/verify test database:', err.message);
    console.error('[db:create:test] Configuration:', {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      user: DATABASE_USER,
      database: adminDatabase,
      testDatabase: TEST_DATABASE_NAME
    });
    process.exit(1);
  } finally {
    await adminClient.end().catch(() => {});
  }
})();