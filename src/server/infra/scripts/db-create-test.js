require('dotenv').config();
const { Client } = require('pg');

/**
 * Automatic database creation script
 *
 * This script creates the main database (livocare) if it doesn't exist.
 * Used for both development and testing.
 * In CI/CD environments, ensure PostgreSQL is available and credentials are correct.
 */

(async () => {
  const {
    DATABASE_HOST = 'localhost',
    DATABASE_PORT = '5432',
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME = 'livocare', // Main database name
  } = process.env;

  if (!DATABASE_USER) {
    console.error('[db:create] DATABASE_USER not defined in .env');
    process.exit(1);
  }

  if (!DATABASE_NAME) {
    console.error('[db:create] DATABASE_NAME not defined in .env');
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
      [DATABASE_NAME]
    );

    if (existsRes.rowCount > 0) {
      console.log(`[db:create] Database '${DATABASE_NAME}' already exists — ok`);
      process.exit(0);
    }

    // Create database (idempotent)
    console.log(`[db:create] Creating database '${DATABASE_NAME}'...`);
    // encoding/template are good practices; adjust collation if needed for your environment
    await adminClient.query(
      `CREATE DATABASE "${DATABASE_NAME}" WITH TEMPLATE template0 ENCODING 'UTF8'`
    );

    // Optional: set owner to the same user
    try {
      await adminClient.query(
        `ALTER DATABASE "${DATABASE_NAME}" OWNER TO "${DATABASE_USER}"`
      );
    } catch (e) {
      // Depending on provider/role this might fail — just log warning
      console.warn(`[db:create] Warning: could not alter OWNER: ${e.message}`);
    }

    console.log(`[db:create] Database '${DATABASE_NAME}' created successfully`);
    process.exit(0);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn('[db:create] ⚠️  PostgreSQL is not running or inaccessible');
      console.warn('[db:create] For local development, make sure:');
      console.warn('[db:create] 1. PostgreSQL is installed and running');
      console.warn('[db:create] 2. Credentials in .env are correct');
      console.warn('[db:create] 3. User has permission to create databases');
      console.warn('[db:create] Continuing anyway (may fail later)...');
      process.exit(0); // Exit gracefully
    }

    console.error('[db:create] Failed to create/verify database:', err.message);
    console.error('[db:create] Configuration:', {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      user: DATABASE_USER,
      database: adminDatabase,
      targetDatabase: DATABASE_NAME
    });
    process.exit(1);
  } finally {
    await adminClient.end().catch(() => {});
  }
})();