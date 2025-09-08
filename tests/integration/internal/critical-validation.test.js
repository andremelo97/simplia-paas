/**
 * CRITICAL AUTHORIZATION VALIDATION TEST SUITE
 * 
 * Este test suite valida o sistema de autorização de 5 camadas enterprise da Simplia PaaS.
 * Garante que todas as verificações de segurança estão funcionando corretamente.
 * 
 * COBERTURA DE TESTES:
 * 
 * ✅ Layer 1: Tenant License Check
 * - Verificação de licença ativa para o tenant
 * - Bloqueio de acesso sem licença
 * - Bloqueio de acesso com licença expirada
 * 
 * ✅ Layer 2: Seat Limit Check  
 * - Verificação de limites de assentos por tenant
 * - Bloqueio quando limite excedido
 * 
 * ✅ Layer 3: User Access Check
 * - Verificação de permissão individual do usuário
 * - Bloqueio de usuários sem acesso explícito
 * 
 * ✅ Layer 4: Role Validation
 * - Verificação de hierarquia de roles (operations < manager < admin)
 * - Bloqueio por role insuficiente
 * 
 * ✅ Layer 5: Audit Logging
 * - Registro completo de todas as tentativas (granted/denied)
 * - Rastreamento de IP, User-Agent, razão da decisão
 * 
 * CENÁRIOS TESTADOS:
 * - Acesso permitido com todas as condições válidas
 * - Bloqueios por cada camada individualmente
 * - Logging de auditoria para compliance
 * - Tokens expirados e inválidos
 * 
 * STATUS: 51 testes falhando (problemas de field naming _fk)
 * PRIORIDADE: CRÍTICO - Validação de segurança enterprise
 */

const request = require('supertest');
const app = require('@server/app');
const { generateTestToken, generateExpiredToken } = require('../../auth-helper');
const { 
  createTestTenant,
  createTestUser, 
  createTestApplication,
  createTestPricing,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
  cleanupTestApplications
} = require('../../test-data-helper');

const TEST_TENANT_SCHEMA = process.env.TEST_TENANT_SCHEMA || 'tenant_test_clinic';

// Add API prefix constant
const INTERNAL_API = process.env.INTERNAL_API_PREFIX || '/internal/api/v1';

describe('Critical Authorization Validation', () => {
  let tenant, user, tqApplication;

  beforeEach(async () => {
    // Clean up only critical test data (not all test data)
    await global.testDb.query('DELETE FROM tenant_applications WHERE tenant_id_fk IN (SELECT id FROM tenants WHERE subdomain = \'critical_test_clinic\')');
    await global.testDb.query('DELETE FROM user_application_access WHERE user_id_fk IN (SELECT id FROM users WHERE email = \'critical-manager@test.com\')');
    await global.testDb.query('DELETE FROM application_access_logs WHERE user_id_fk IN (SELECT id FROM users WHERE email = \'critical-manager@test.com\')');

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
      `INSERT INTO users (tenant_id_fk, tenant_name, email, password_hash, first_name, last_name, role, status, platform_role, user_type_id_fk)
       VALUES ($1, $2, 'critical-manager@test.com', $3, 'Critical', 'Manager', 'manager', 'active', 'internal_admin', 2)
       ON CONFLICT (email) DO UPDATE SET
         tenant_id_fk = EXCLUDED.tenant_id_fk,
         tenant_name = EXCLUDED.tenant_name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         platform_role = EXCLUDED.platform_role,
         updated_at = NOW()
       RETURNING *`,
      [tenant.id, tenant.name, hashedPassword]  // Use numeric id for FK and tenant name
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
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, active)
         VALUES ($1, $2, 'active', true)`,
        [tenant.id, tqApplication.id]
      );

      // Seed user application access
      await global.testDb.query(
        `INSERT INTO user_application_access (tenant_id_fk, user_id_fk, application_id_fk, active, active)
         VALUES ($1, $2, $3, true, true)`,
        [tenant.id, user.id, tqApplication.id]
      );

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
        allowedApps: ['tq'],
        role: 'manager',
        platformRole: 'internal_admin'
      });

      const response = await request(app)
        .get(`${INTERNAL_API}/tq/dashboard`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', tenant.subdomain);

      if (response.status !== 200) {
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Welcome');
    });

    test('should deny access without license', async () => {
      // No license seeded

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
        allowedApps: ['tq'],
        role: 'manager',
        platformRole: 'internal_admin'
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
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, expiry_date, active)
         VALUES ($1, $2, 'expired', '2023-01-01', false)`,
        [tenant.id, tqApplication.id]
      );

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
        allowedApps: ['tq'],
        role: 'manager',
        platformRole: 'internal_admin'
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
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, user_limit, seats_used, active)
         VALUES ($1, $2, 'active', 1, 1, true)`,
        [tenant.id, tqApplication.id]
      );

      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
        allowedApps: ['tq'],
        role: 'manager',
        platformRole: 'internal_admin'
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
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, active)
         VALUES ($1, $2, 'active', true)`,
        [tenant.id, tqApplication.id]
      );

      // Token without 'tq' in allowedApps
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
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
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, active)
         VALUES ($1, $2, 'active', true)`,
        [tenant.id, tqApplication.id]
      );

      // Operations token (not admin)
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
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
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, active)
         VALUES ($1, $2, 'active', true)`,
        [tenant.id, tqApplication.id]
      );

      // Seed user application access
      await global.testDb.query(
        `INSERT INTO user_application_access (tenant_id_fk, user_id_fk, application_id_fk, active, active)
         VALUES ($1, $2, $3, true, true)`,
        [tenant.id, user.id, tqApplication.id]
      );

      // Admin token
      const token = generateTestToken({
        userId: user.id,
        tenantId: tenant.id, // Use numeric tenant ID
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
        tenantId: tenant.id, // Use numeric tenant ID
        allowedApps: ['tq'],
        role: 'manager',
        platformRole: 'internal_admin'
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
        tenantId: tenant.id, // Use numeric tenant ID
        allowedApps: ['tq'],
        role: 'manager',
        platformRole: 'internal_admin'
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

  describe('Grant/Revoke with Seat Limits and Pricing', () => {
    let adminToken;

    beforeEach(async () => {
      adminToken = generateTestToken({
        userId: user.id,
        tenantId: tenant.id,
        allowedApps: ['tq'],
        role: 'admin',
        platformRole: 'internal_admin'
      });

      // Ensure we have pricing data (from migration seeds)
      const pricingResult = await global.testDb.query(
        'SELECT COUNT(*) as count FROM application_pricing WHERE application_id = $1',
        [tqApplication.id]
      );
      
      if (parseInt(pricingResult.rows[0].count) === 0) {
        // Add test pricing if not exists
        const userTypesResult = await global.testDb.query(
          'SELECT * FROM user_types WHERE slug = \'manager\' LIMIT 1'
        );
        if (userTypesResult.rows.length > 0) {
          await global.testDb.query(
            `INSERT INTO application_pricing (application_id, user_type_id, price, currency, billing_cycle, valid_from)
             VALUES ($1, $2, 55.00, 'BRL', 'monthly', NOW())`,
            [tqApplication.id, userTypesResult.rows[0].id]
          );
        }
      }
    });

    test('should grant access and increment seat count', async () => {
      // Seed license with available seats
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used, active)
         VALUES ($1, $2, $3, 'active', 5, 2, true)
         ON CONFLICT (tenant_id_fk, application_id) DO UPDATE SET
           user_limit = 5, seats_used = 2, status = 'active', active = true`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      const response = await request(app)
        .post(`${INTERNAL_API}/users/${user.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'tq'
        });

      expect(response.status).toBe(201);
      expect(response.body.meta.code).toBe('USER_APP_ACCESS_GRANTED');
      expect(response.body.data.seatsUsed).toBe(3); // 2 + 1

      // Verify pricing snapshot was captured
      expect(response.body.data.pricing).toBeDefined();
      expect(response.body.data.pricing.price).toBeGreaterThan(0);
      expect(response.body.data.pricing.currency).toBe('BRL');

      // Verify database state
      const accessResult = await global.testDb.query(
        'SELECT * FROM user_application_access WHERE user_id = $1 AND application_id = $2',
        [user.id, tqApplication.id]
      );
      
      expect(accessResult.rows.length).toBe(1);
      expect(accessResult.rows[0].price_snapshot).toBeTruthy();
      expect(accessResult.rows[0].currency_snapshot).toBe('BRL');
      expect(accessResult.rows[0].user_type_id_snapshot).toBeTruthy();
    });

    test('should deny grant when seat limit would be exceeded', async () => {
      // Seed license with limit almost reached
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used, active)
         VALUES ($1, $2, $3, 'active', 2, 2, true)
         ON CONFLICT (tenant_id_fk, application_id) DO UPDATE SET
           user_limit = 2, seats_used = 2, status = 'active', active = true`,
        [tenant.subdomain, tenant.id, tqApplication.id]
      );

      const response = await request(app)
        .post(`${INTERNAL_API}/users/${user.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'tq'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Seat Limit Exceeded');
      expect(response.body.message).toContain('seat limit of 2 reached');

      // Verify no access was created
      const accessResult = await global.testDb.query(
        'SELECT * FROM user_application_access WHERE user_id = $1 AND application_id = $2 AND active = true',
        [user.id, tqApplication.id]
      );
      expect(accessResult.rows.length).toBe(0);
    });

    test('should revoke access and decrement seat count', async () => {
      // First grant access
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id_fk, application_id_fk, status, user_limit, seats_used, active)
         VALUES ($1, $2, 'active', 5, 3, true)
         ON CONFLICT (tenant_id_fk, application_id_fk) DO UPDATE SET
           user_limit = 5, seats_used = 3, status = 'active', active = true`,
        [tenant.id, tqApplication.id]
      );

      await global.testDb.query(
        `INSERT INTO user_application_access (user_id_fk, application_id_fk, tenant_id_fk, active, active, price_snapshot, currency_snapshot)
         VALUES ($1, $2, $3, true, true, 55.00, 'BRL')
         ON CONFLICT (tenant_id_fk, user_id_fk, application_id_fk) DO UPDATE SET
           active = true, active = true`,
        [user.id, tqApplication.id, tenant.id]
      );

      const response = await request(app)
        .delete(`${INTERNAL_API}/users/${user.id}/apps/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'tq'
        });

      expect(response.status).toBe(200);
      expect(response.body.meta.code).toBe('USER_APP_ACCESS_REVOKED');

      // Verify seat count decremented
      const seatResult = await global.testDb.query(
        'SELECT seats_used FROM tenant_applications WHERE tenant_id_fk = $1 AND application_id = $2',
        [tenant.id, tqApplication.id]
      );
      expect(seatResult.rows[0].seats_used).toBe(2); // 3 - 1

      // Verify access is revoked
      const accessResult = await global.testDb.query(
        'SELECT * FROM user_application_access WHERE user_id = $1 AND application_id = $2',
        [user.id, tqApplication.id]
      );
      expect(accessResult.rows[0].active).toBe(false);
    });
  });
});