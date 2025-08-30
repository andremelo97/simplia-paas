const { Pool } = require('pg');
require('dotenv').config();

// Database de teste separada
const testDbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.TEST_DATABASE_NAME || 'simplia_paas_test',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
};

// Override environment for test database BEFORE any app modules are loaded
process.env.DATABASE_NAME = testDbConfig.database;

const TEST_TENANT_SCHEMA = process.env.TEST_TENANT_SCHEMA || 'tenant_test_clinic';

let testDb;

beforeAll(async () => {
  testDb = new Pool(testDbConfig);
  global.testDb = testDb;  // Set global after pool creation
  
  // Executar migrations na database de teste
  const { execSync } = require('child_process');
  try {
    execSync('npm run migrate', { 
      env: { 
        ...process.env, 
        DATABASE_NAME: testDbConfig.database 
      },
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  // Cria schema de tenant de teste (idempotente)
  function qIdent(name) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`Invalid identifier: ${name}`);
    }
    return `"${name}"`;
  }

  // cria schema se não existir
  await testDb.query(`CREATE SCHEMA IF NOT EXISTS ${qIdent(TEST_TENANT_SCHEMA)}`);
});

afterAll(async () => {
  if (testDb) {
    await testDb.end();
  }
});

// Função de limpeza do schema
async function truncateTenantSchema(client, schema) {
  const qIdent = (name) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return null;
    return `"${name}"`;
  };
  
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1`,
    [schema]
  );
  
  for (const { tablename } of rows) {
    const safeTable = qIdent(tablename);
    const safeSchema = qIdent(schema);
    if (safeTable && safeSchema) {
      await client.query(
        `TRUNCATE TABLE ${safeSchema}.${safeTable} RESTART IDENTITY CASCADE`
      );
    }
  }
}

// Reset simples de dados entre testes
afterEach(async () => {
  try {
    // limpa tabelas do schema do tenant de teste
    await truncateTenantSchema(testDb, TEST_TENANT_SCHEMA);

    // Se você mantém dados "catálogo" em public (ex.: applications, user_types), preserve-os.
    // Caso precise, limpe apenas tabelas voláteis do public:
    await testDb.query('DELETE FROM application_access_logs'); // se ficar em public
    await testDb.query('DELETE FROM user_application_access');
    await testDb.query('DELETE FROM tenant_applications');
    await testDb.query('DELETE FROM users');
    await testDb.query('DELETE FROM tenants');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});

// global.testDb is now set in beforeAll