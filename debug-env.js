require('dotenv').config();

console.log('🔍 Environment Variables Check:\n');

console.log('Database Configuration:');
console.log('- DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('- DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('- DATABASE_NAME:', process.env.DATABASE_NAME);
console.log('- DATABASE_USER:', process.env.DATABASE_USER);
console.log('- DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '***' + process.env.DATABASE_PASSWORD.slice(-2) : 'undefined');
console.log();

console.log('Testing Database Connection:');
const db = require('./src/server/infra/db/database');

async function testConnection() {
  try {
    const result = await db.query('SELECT 1 as test');
    console.log('✅ Database singleton connection: SUCCESS');
    console.log('   Result:', result.rows[0]);
  } catch (error) {
    console.log('❌ Database singleton connection: FAILED');
    console.log('   Error:', error.message);
  }
}

testConnection();