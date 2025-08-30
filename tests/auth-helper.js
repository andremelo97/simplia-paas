const jwt = require('jsonwebtoken');

const defaultSchema = process.env.TEST_TENANT_SCHEMA || 'tenant_test_clinic';

function generateTestToken(overrides = {}) {
  const payload = {
    userId: 1,
    tenantId: 'test_clinic',  // Use subdomain for tenantId
    role: 'manager',
    schema: defaultSchema,
    allowedApps: ['tq'],
    userType: 'manager',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
    ...overrides, // This will override the defaults above
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET);
}

function generateExpiredToken(overrides = {}) {
  return jwt.sign(
    { 
      userId: overrides.userId || 1, 
      tenantId: overrides.tenantId || 'test_clinic',
      schema: defaultSchema,
      exp: Math.floor(Date.now() / 1000) - 3600 
    },
    process.env.JWT_SECRET
  );
}

module.exports = {
  generateTestToken,
  generateExpiredToken,
};