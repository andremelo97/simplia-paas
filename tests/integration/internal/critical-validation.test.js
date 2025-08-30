const request = require('supertest');
const app = require('@server/app');
const { generateTestToken, generateExpiredToken } = require('../../auth-helper');

const TEST_TENANT_SCHEMA = process.env.TEST_TENANT_SCHEMA || 'tenant_test_clinic';

// Add API prefix constant
const INTERNAL_API = process.env.INTERNAL_API_PREFIX || '/internal/api/v1';

describe('Critical Authorization Validation', () => {
  let tenant, user, tqApplication;

  beforeEach(async () => {
    // Clean up only critical test data (not all test data)
    await global.testDb.query('DELETE FROM tenant_applications WHERE tenant_id_fk IN (SELECT id FROM tenants WHERE subdomain = \'critical_test_clinic\')');
    await global.testDb.query('DELETE FROM user_application_access WHERE user_id IN (SELECT id FROM users WHERE email = \'critical-manager@test.com\')');
    await global.testDb.query('DELETE FROM application_access_logs WHERE user_id IN (SELECT id FROM users WHERE email = \'critical-manager@test.com\')');

    // Create the tenant schema
    await global.testDb.query('CREATE SCHEMA IF NOT EXISTS tenant_critical_test_clinic');

    // Seed tenant (using ON CONFLICT to handle existing data from migrations)
    const tenantResult = await global.testDb.query(
      `INSERT INTO tenants (name, subdomain, schema_name, status, active)
       VALUES ($1, $2, $3, 'active', true)
       ON CONFLICT (subdomain) DO UPDATE SET 
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         active = EXCLUDED.active
       RETURNING *`,
      ['Critical Test Clinic', 'critical_test_clinic', 'tenant_critical_test_clinic']
    );
    tenant = tenantResult.rows[0];

    // Seed user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const userResult = await global.testDb.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
       VALUES ($1, 'critical-manager@test.com', $2, 'Critical', 'Manager', 'manager', 'active')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING *`,
      [tenant.subdomain, hashedPassword]  // Use subdomain instead of id
    );
    user = userResult.rows[0];

    // Get TQ application - it should exist after migration
    const appResult = await global.testDb.query(
      "SELECT * FROM applications WHERE slug = 'tq' LIMIT 1"
    );
    
    if (appResult.rows.length === 0) {
      throw new Error("TQ application not found. Migration may have failed.");
    }
    
    tqApplication = appResult.rows[0];
  });

  describe('Layer 1: Tenant License Check', () => {
    test('should allow access with active license', async () => {
      // Seed active license
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, active)
         VALUES ($1, $2, $3, 'active', true)`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['tq'],
        role: 'manager'
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Welcome');
    });

    test('should deny access without license', async () => {
      // No license seeded

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['tq'],
        role: 'manager'
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not licensed');
    });

    test('should deny access with expired license', async () => {
      // Seed expired license
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, expiry_date, active)
         VALUES ($1, $2, $3, 'expired', '2023-01-01', false)`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['tq'],
        role: 'manager'
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/expired|not licensed/);
    });
  });

  describe('Layer 2: Seat Limit Check', () => {
    test('should deny access when seat limit exceeded', async () => {
      // Seed license with limit reached
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used, active)
         VALUES ($1, $2, $3, 'active', 1, 1, true)`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['tq'],
        role: 'manager'
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/seat|limit/);
    });
  });

  describe('Layer 3: User Access Check', () => {
    test('should deny access when app not in allowedApps', async () => {
      // Seed active license
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, active)
         VALUES ($1, $2, $3, 'active', true)`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      // Token without 'tq' in allowedApps
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['pm'], // only patient management
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/not allowed|access denied/);
    });
  });

  describe('Layer 4: Role Validation', () => {
    test('should deny operations access to admin endpoints', async () => {
      // Seed active license
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, active)
         VALUES ($1, $2, $3, 'active', true)`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      // Operations token (not admin)
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        role: 'operations',
        userType: 'operations',
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/admin`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/role|admin|insufficient/);
    });

    test('should allow admin access to admin endpoints', async () => {
      // Seed active license
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, active)
         VALUES ($1, $2, $3, 'active', true)`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      // Admin token
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        role: 'admin',
        userType: 'admin',
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/admin`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Admin Panel');
    });
  });

  describe('Authentication Edge Cases', () => {
    test('should deny access with expired token', async () => {
      const expiredToken = generateExpiredToken();

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/expired|invalid/);
    });

    test('should deny access without tenant header', async () => {
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['tq'],
        role: 'manager'
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`);
        // Missing x-tenant-id header

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Tenant');
    });
  });

  describe('Audit Logging', () => {
    test('should create audit log on access denial', async () => {
      // No license seeded - will be denied

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.subdomain,
        allowedApps: ['tq'],
        role: 'manager'
      });

      await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      // Check if audit log was created
      const logResult = await global.testDb.query(
        'SELECT * FROM application_access_logs WHERE tenant_id_fk = $1 AND decision = $2',
        [tenant.id, 'denied']
      );

      expect(logResult.rows.length).toBeGreaterThan(0);
      expect(logResult.rows[0].reason).toBeTruthy();
    });
  });
});