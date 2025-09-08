/**
 * TEST DATA HELPER
 * 
 * Helper para criação e limpeza de dados de teste de forma auto-suficiente.
 * Garante que cada test suite possa criar e deletar seus próprios dados.
 */

/**
 * Create a test tenant with all required data
 * @param {Object} options - Tenant configuration
 * @returns {Object} Created tenant data
 */
async function createTestTenant(options = {}) {
  const {
    name = 'Test Clinic',
    subdomain = 'test_clinic_' + Date.now(),
    schema = 'tenant_' + subdomain,
    status = 'active'
  } = options;

  // Create tenant schema first
  await global.testDb.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

  // Create tenant record
  const tenantResult = await global.testDb.query(
    `INSERT INTO tenants (name, subdomain, schema_name, status, active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [name, subdomain, schema, status]
  );

  return tenantResult.rows[0];
}

/**
 * Create a test user linked to a tenant
 * @param {number} tenantId - Tenant ID (numeric FK)
 * @param {Object} options - User configuration
 * @returns {Object} Created user data
 */
async function createTestUser(tenantId, options = {}) {
  const {
    email = 'test_user_' + Date.now() + '@test.com',
    firstName = 'Test',
    lastName = 'User',
    role = 'admin',
    status = 'active',
    passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMye5XzNcXzgzXvlhRaD.X.YJYnQlLKRfxK' // 'password'
  } = options;

  // Get user type
  const userTypeResult = await global.testDb.query(
    'SELECT * FROM user_types WHERE slug = $1',
    [role]
  );
  
  const userTypeId = userTypeResult.rows[0]?.id;

  const userResult = await global.testDb.query(
    `INSERT INTO users (tenant_id_fk, email, first_name, last_name, password_hash, role, status, user_type_id_fk)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [tenantId, email, firstName, lastName, passwordHash, role, status, userTypeId]
  );

  return userResult.rows[0];
}

/**
 * Create a test application
 * @param {Object} options - Application configuration  
 * @returns {Object} Created application data
 */
async function createTestApplication(options = {}) {
  const {
    name = 'Test Application',
    slug = 'test_app_' + Date.now(),
    description = 'Test Application Description',
    version = '1.0.0',
    status = 'active'
  } = options;

  const appResult = await global.testDb.query(
    `INSERT INTO applications (name, slug, description, version, status, active)
     VALUES ($1, $2, $3, $4, $5, true)
     ON CONFLICT (slug) DO UPDATE SET 
       name = EXCLUDED.name,
       status = EXCLUDED.status
     RETURNING *`,
    [name, slug, description, version, status]
  );

  return appResult.rows[0];
}

/**
 * Create application pricing entries
 * @param {number} applicationId - Application ID
 * @param {Array} pricingEntries - Array of pricing configurations
 */
async function createTestPricing(applicationId, pricingEntries = []) {
  const defaultPricing = [
    { userTypeSlug: 'operations', price: 35.00 },
    { userTypeSlug: 'manager', price: 55.00 },
    { userTypeSlug: 'admin', price: 80.00 }
  ];

  const entries = pricingEntries.length > 0 ? pricingEntries : defaultPricing;

  for (const entry of entries) {
    // Get user type ID
    const userTypeResult = await global.testDb.query(
      'SELECT * FROM user_types WHERE slug = $1',
      [entry.userTypeSlug]
    );
    
    if (userTypeResult.rows.length === 0) continue;
    
    const userTypeId = userTypeResult.rows[0].id;

    await global.testDb.query(
      `INSERT INTO application_pricing 
       (application_id_fk, user_type_id_fk, price, currency, billing_cycle, valid_from, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (application_id_fk, user_type_id_fk, valid_from) DO UPDATE SET
         price = EXCLUDED.price,
         active = EXCLUDED.active`,
      [applicationId, userTypeId, entry.price, entry.currency || 'BRL', 
       entry.billingCycle || 'monthly', entry.validFrom || new Date()]
    );
  }
}

/**
 * Create tenant application license
 * @param {number} tenantId - Tenant ID
 * @param {number} applicationId - Application ID  
 * @param {Object} options - License configuration
 */
async function createTestLicense(tenantId, applicationId, options = {}) {
  const {
    userLimit = 100,
    seatsUsed = 0,
    status = 'active',
    expiryDate = null
  } = options;

  await global.testDb.query(
    `INSERT INTO tenant_applications 
     (tenant_id_fk, application_id_fk, user_limit, seats_used, status, active, expiry_date)
     VALUES ($1, $2, $3, $4, $5, true, $6)
     ON CONFLICT (tenant_id_fk, application_id_fk) DO UPDATE SET
       user_limit = EXCLUDED.user_limit,
       seats_used = EXCLUDED.seats_used,
       status = EXCLUDED.status,
       active = EXCLUDED.active`,
    [tenantId, applicationId, userLimit, seatsUsed, status, expiryDate]
  );
}

/**
 * Grant user access to application with pricing snapshot
 * @param {number} userId - User ID
 * @param {number} tenantId - Tenant ID
 * @param {number} applicationId - Application ID
 * @param {Object} options - Access configuration
 */
async function createTestUserAccess(userId, tenantId, applicationId, options = {}) {
  const {
    roleInApp = 'user',
    userTypeId = 1,
    priceSnapshot = 35.00,
    currencySnapshot = 'BRL',
    grantedCycle = 'monthly'
  } = options;

  await global.testDb.query(
    `INSERT INTO user_application_access 
     (user_id_fk, tenant_id_fk, application_id_fk, role_in_app, active, 
      price_snapshot, currency_snapshot, user_type_id_snapshot, granted_cycle)
     VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8)
     ON CONFLICT (user_id_fk, tenant_id_fk, application_id_fk) DO UPDATE SET
       role_in_app = EXCLUDED.role_in_app,
       active = EXCLUDED.active,
       price_snapshot = EXCLUDED.price_snapshot`,
    [userId, tenantId, applicationId, roleInApp, priceSnapshot, currencySnapshot, userTypeId, grantedCycle]
  );
}

/**
 * Clean up test data by tenant
 * @param {number} tenantId - Tenant ID to clean up
 * @param {string} tenantSchema - Tenant schema to drop
 */
async function cleanupTestTenant(tenantId, tenantSchema = null) {
  try {
    // Delete in dependency order
    await global.testDb.query('DELETE FROM application_access_logs WHERE tenant_id_fk = $1', [tenantId]);
    await global.testDb.query('DELETE FROM user_application_access WHERE tenant_id_fk = $1', [tenantId]);
    await global.testDb.query('DELETE FROM tenant_applications WHERE tenant_id_fk = $1', [tenantId]);
    await global.testDb.query('DELETE FROM users WHERE tenant_id_fk = $1', [tenantId]);
    
    // Drop tenant schema if provided
    if (tenantSchema) {
      await global.testDb.query(`DROP SCHEMA IF EXISTS "${tenantSchema}" CASCADE`);
    }
    
    await global.testDb.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
}

/**
 * Clean up test applications (use with care - may affect other tests)
 * @param {Array} applicationIds - Application IDs to clean up
 */
async function cleanupTestApplications(applicationIds = []) {
  try {
    for (const appId of applicationIds) {
      await global.testDb.query('DELETE FROM application_pricing WHERE application_id_fk = $1', [appId]);
      await global.testDb.query('DELETE FROM user_application_access WHERE application_id_fk = $1', [appId]);
      await global.testDb.query('DELETE FROM tenant_applications WHERE application_id_fk = $1', [appId]);
      await global.testDb.query('DELETE FROM applications WHERE id = $1', [appId]);
    }
  } catch (error) {
    console.warn('Application cleanup warning:', error.message);
  }
}

/**
 * Get core data that should exist (applications, user_types)
 */
async function getCoreTestData() {
  const appsResult = await global.testDb.query('SELECT * FROM applications ORDER BY id LIMIT 5');
  const userTypesResult = await global.testDb.query('SELECT * FROM user_types ORDER BY hierarchy_level');
  
  return {
    applications: appsResult.rows,
    userTypes: userTypesResult.rows
  };
}

module.exports = {
  createTestTenant,
  createTestUser,
  createTestApplication,
  createTestPricing,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
  cleanupTestApplications,
  getCoreTestData
};