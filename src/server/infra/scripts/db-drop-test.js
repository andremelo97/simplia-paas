require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const {
    DATABASE_HOST = 'localhost',
    DATABASE_PORT = '5432',
    DATABASE_USER,
    DATABASE_PASSWORD,
    TEST_DATABASE_NAME = 'simplia_paas_test',
  } = process.env;

  if (!DATABASE_USER) {
    console.error('[db:drop:test] DATABASE_USER not defined in .env');
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
    console.log(`[db:drop:test] Dropping database '${TEST_DATABASE_NAME}'...`);
    
    // Terminate active connections
    await adminClient.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
      [TEST_DATABASE_NAME]
    );
    
    await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DATABASE_NAME}"`);
    console.log(`[db:drop:test] Database '${TEST_DATABASE_NAME}' dropped successfully`);
    process.exit(0);
  } catch (err) {
    console.error('[db:drop:test] Failed to drop test database:', err.message);
    process.exit(1);
  } finally {
    await adminClient.end().catch(() => {});
  }
})();