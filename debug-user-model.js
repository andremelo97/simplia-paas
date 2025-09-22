require('dotenv').config();

const User = require('./src/server/infra/models/User');

async function testUserModel() {
  try {
    console.log('🔍 Testing User.findByEmail method directly...\n');

    const email = 'andre.melo9715@uol.com';
    const tenantIdFk = 2;

    console.log('Parameters:');
    console.log('- Email:', email);
    console.log('- Tenant ID FK:', tenantIdFk);
    console.log();

    const user = await User.findByEmail(email, tenantIdFk);

    console.log('✅ User.findByEmail SUCCESS!');
    console.log('- User ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Status:', user.status);
    console.log('- Tenant ID FK:', user.tenantIdFk);
    console.log('- Name:', user.name);
    console.log('- Password hash length:', user.passwordHash ? user.passwordHash.length : 'null');

  } catch (error) {
    console.log('❌ User.findByEmail FAILED');
    console.log('- Error message:', error.message);
    console.log('- Error name:', error.name);
    console.log('- Full error:', error);
  }
}

testUserModel();