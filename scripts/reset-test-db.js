require('dotenv').config();
const { Client } = require('pg');

async function resetTestDatabase() {
  const {
    DATABASE_HOST = 'localhost',
    DATABASE_PORT = '5432',
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME = 'livocare',
  } = process.env;

  if (!DATABASE_USER) {
    console.error('[db:reset:test] DATABASE_USER not defined in .env');
    process.exit(1);
  }

  const client = new Client({
    host: DATABASE_HOST,
    port: Number(DATABASE_PORT),
    user: DATABASE_USER,
    password: String(DATABASE_PASSWORD),
    database: DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log(`Connected to test database '${DATABASE_NAME}'`);

    // Get all tenant schemas
    const { rows: schemas } = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'tenant_%'
    `);

    console.log(`\nFound ${schemas.length} tenant schemas to drop:`);
    schemas.forEach(s => console.log(`   - ${s.schema_name}`));

    // Drop tenant schemas
    for (const { schema_name } of schemas) {
      console.log(`\nDropping schema: ${schema_name}...`);
      await client.query(`DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`);
    }

    // Drop and recreate public schema
    console.log('\nDropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');

    console.log('\nDatabase reset complete!');
    console.log('\nNext steps:');
    console.log('   1. Run: npm run migrate');
    console.log('   2. Start the application');

  } catch (error) {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetTestDatabase();
