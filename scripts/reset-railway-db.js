require('dotenv').config();
const { Client } = require('pg');

async function resetDatabase() {
  const connectionString = process.env.RAILWAY_DATABASE_URL;

  if (!connectionString) {
    console.error('RAILWAY_DATABASE_URL not defined in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to Railway database');

    // Get all schemas
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
    console.log('   1. Go to Railway → Deployments');
    console.log('   2. Click ... (three dots) → Redeploy');
    console.log('   3. Migrations will run automatically on deploy');

  } catch (error) {
    console.error('Error resetting database:', error.message || error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
