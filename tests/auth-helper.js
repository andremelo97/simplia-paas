/**
 * AUTH HELPER
 *
 * Helper para geração de tokens JWT para testes.
 * IMPORTANTE: tenantId deve ser SEMPRE numérico (regra crítica do projeto)
 */

const jwt = require('jsonwebtoken');

const defaultSchema = process.env.TEST_TENANT_SCHEMA || 'tenant_test_clinic';

/**
 * Generate a valid JWT token for testing
 * @param {Object} overrides - Override default payload values
 * @returns {string} JWT token
 */
function generateTestToken(overrides = {}) {
  const payload = {
    userId: 1,
    tenantId: 1,  // MUST be numeric (integer)
    email: 'test@test.com',
    name: 'Test User',
    role: 'admin',
    schema: defaultSchema,
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
    allowedApps: ['tq', 'hub'],
    userType: {
      id: 3,
      slug: 'admin',
      name: 'Admin',
      hierarchyLevel: 100
    },
    platformRole: null,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    ...overrides,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
}

/**
 * Generate an expired JWT token for testing auth failures
 * @param {Object} overrides - Override default payload values
 * @returns {string} Expired JWT token
 */
function generateExpiredToken(overrides = {}) {
  const payload = {
    userId: overrides.userId || 1,
    tenantId: overrides.tenantId || 1,  // MUST be numeric
    email: 'test@test.com',
    schema: defaultSchema,
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    ...overrides,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
}

/**
 * Generate a platform admin token (for Internal-Admin routes)
 * @param {Object} overrides - Override default payload values
 * @returns {string} JWT token with platform admin role
 */
function generatePlatformAdminToken(overrides = {}) {
  return generateTestToken({
    platformRole: 'internal_admin',
    role: 'admin',
    ...overrides,
  });
}

/**
 * Generate a token for a specific user type
 * @param {string} userTypeSlug - 'operations', 'manager', or 'admin'
 * @param {Object} overrides - Override default payload values
 * @returns {string} JWT token
 */
function generateTokenForUserType(userTypeSlug, overrides = {}) {
  const userTypes = {
    operations: { id: 1, slug: 'operations', name: 'Operations', hierarchyLevel: 10 },
    manager: { id: 2, slug: 'manager', name: 'Manager', hierarchyLevel: 50 },
    admin: { id: 3, slug: 'admin', name: 'Admin', hierarchyLevel: 100 },
  };

  return generateTestToken({
    role: userTypeSlug,
    userType: userTypes[userTypeSlug] || userTypes.operations,
    ...overrides,
  });
}

/**
 * Decode a JWT token without verification (for testing)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateTestToken,
  generateExpiredToken,
  generatePlatformAdminToken,
  generateTokenForUserType,
  decodeToken,
};
