const authService = require('./src/server/infra/authService');
const User = require('./src/server/infra/models/User');
const { Pool } = require('pg');

// Use the same database config as the app
const db = new Pool({
  user: process.env.DATABASE_USER || 'simplia',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'simplia_paas_test',
  password: process.env.DATABASE_PASSWORD || '1234',
  port: process.env.DATABASE_PORT || 5432,
});

async function debugAuth() {
  try {
    console.log('🔍 Debugging authentication for andre.melo9715@uol.com...\n');

    // 1. Check if user exists in database
    console.log('1. Checking if user exists in database...');
    const query = `
      SELECT u.id, u.email, u.password_hash, u.tenant_id_fk, u.status, u.first_name, u.last_name, u.active,
             t.id as tenant_id, t.name as tenant_name, t.subdomain as tenant_slug
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id_fk = t.id
      WHERE u.email = $1
    `;

    const result = await db.query(query, ['andre.melo9715@uol.com']);

    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }

    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('   - ID:', user.id);
    console.log('   - Email:', user.email);
    console.log('   - Status:', user.status);
    console.log('   - Active:', user.active);
    console.log('   - Tenant ID:', user.tenant_id_fk);
    console.log('   - Tenant Name:', user.tenant_name);
    console.log('   - Password hash length:', user.password_hash ? user.password_hash.length : 'NULL');
    console.log();

    // 2. Test password comparison
    console.log('2. Testing password comparison...');
    const testPassword = '12345678';
    const isPasswordValid = await authService.comparePassword(testPassword, user.password_hash);
    console.log('   - Test password:', testPassword);
    console.log('   - Hash from DB:', user.password_hash.substring(0, 20) + '...');
    console.log('   - Password valid:', isPasswordValid ? '✅ YES' : '❌ NO');
    console.log();

    // 3. Test User.findByEmail method
    console.log('3. Testing User.findByEmail method...');
    try {
      const foundUser = await User.findByEmail('andre.melo9715@uol.com', user.tenant_id_fk);
      console.log('✅ User.findByEmail successful:');
      console.log('   - Found user ID:', foundUser.id);
      console.log('   - Found user email:', foundUser.email);
      console.log('   - Found user status:', foundUser.status);
    } catch (error) {
      console.log('❌ User.findByEmail failed:', error.message);
    }
    console.log();

    // 4. Test full login process
    console.log('4. Testing full login process...');
    const tenantContext = {
      id: user.tenant_id_fk,
      tenantId: user.tenant_id_fk,
      schema: `tenant_${user.tenant_slug}`
    };

    try {
      const loginResult = await authService.login(tenantContext, {
        email: 'andre.melo9715@uol.com',
        password: testPassword
      });
      console.log('✅ Login successful!');
      console.log('   - Token generated:', !!loginResult.token);
      console.log('   - User data:', loginResult.user.email);
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      console.log('   - Error name:', error.name);
      console.log('   - Error stack:', error.stack);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await db.end();
  }
}

debugAuth();