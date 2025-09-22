require('dotenv').config();

const authService = require('./src/server/infra/authService');

async function testAuthService() {
  try {
    console.log('🔍 Testing authService.login method directly...\n');

    const tenantContext = {
      id: 2,
      tenantId: 2,
      schema: 'tenant_test_clinic'
    };

    const credentials = {
      email: 'andre.melo9715@uol.com',
      password: '12345678'
    };

    console.log('Parameters:');
    console.log('- Tenant Context:', tenantContext);
    console.log('- Email:', credentials.email);
    console.log('- Password:', credentials.password);
    console.log();

    const result = await authService.login(tenantContext, credentials);

    console.log('✅ authService.login SUCCESS!');
    console.log('- User email:', result.user.email);
    console.log('- Token generated:', !!result.token);
    console.log('- Token length:', result.token ? result.token.length : 0);
    console.log('- Allowed apps:', result.allowedApps);
    console.log('- User type:', result.userType ? result.userType.name : 'null');

  } catch (error) {
    console.log('❌ authService.login FAILED');
    console.log('- Error message:', error.message);
    console.log('- Error name:', error.name);
    if (error.stack) {
      console.log('- Stack trace:');
      console.log(error.stack);
    }
  }
}

testAuthService();