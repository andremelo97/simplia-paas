const request = require('supertest');
const app = require('@server/app');
const { generateTestToken } = require('../../auth-helper');

const INTERNAL_API = process.env.INTERNAL_API_PREFIX || '/internal/api/v1';

describe('Pricing System Integration Tests', () => {
  let tenant, user, adminUser, tqApplication, pmApplication;
  let operationsUserType, managerUserType, adminUserType;

  beforeAll(async () => {
    // Clean up test data
    await global.testDb.query('DELETE FROM application_pricing WHERE application_id IN (SELECT id FROM applications WHERE slug IN (\'tq\', \'pm\'))');
    await global.testDb.query('DELETE FROM tenant_applications WHERE tenant_id_fk IN (SELECT id FROM tenants WHERE subdomain = \'pricing_test_clinic\')');
    await global.testDb.query('DELETE FROM user_application_access WHERE user_id IN (SELECT id FROM users WHERE email IN (\'pricing-user@test.com\', \'pricing-admin@test.com\'))');
    await global.testDb.query('DELETE FROM users WHERE email IN (\'pricing-user@test.com\', \'pricing-admin@test.com\')');
    await global.testDb.query('DELETE FROM tenants WHERE subdomain = \'pricing_test_clinic\'');

    // Create tenant schema
    await global.testDb.query('CREATE SCHEMA IF NOT EXISTS tenant_pricing_test_clinic');

    // Seed tenant
    const tenantResult = await global.testDb.query(
      `INSERT INTO tenants (name, subdomain, schema_name, status, active)
       VALUES ($1, $2, $3, 'active', true)
       RETURNING *`,
      ['Pricing Test Clinic', 'pricing_test_clinic', 'tenant_pricing_test_clinic']
    );
    tenant = tenantResult.rows[0];

    // Get user types
    const userTypesResult = await global.testDb.query(
      'SELECT * FROM user_types WHERE slug IN (\'operations\', \'manager\', \'admin\') ORDER BY hierarchy_level'
    );
    [operationsUserType, managerUserType, adminUserType] = userTypesResult.rows;

    // Create test users
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const userResult = await global.testDb.query(
      `INSERT INTO users (tenant_id_fk, tenant_id, email, password_hash, first_name, last_name, role, status, user_type_id)
       VALUES ($1, $2, 'pricing-user@test.com', $3, 'Pricing', 'User', 'operations', 'active', $4)
       RETURNING *`,
      [tenant.id, tenant.subdomain, hashedPassword, operationsUserType.id]
    );
    user = userResult.rows[0];

    const adminResult = await global.testDb.query(
      `INSERT INTO users (tenant_id_fk, tenant_id, email, password_hash, first_name, last_name, role, status, platform_role, user_type_id)
       VALUES ($1, $2, 'pricing-admin@test.com', $3, 'Pricing', 'Admin', 'admin', 'active', 'internal_admin', $4)
       RETURNING *`,
      [tenant.id, tenant.subdomain, hashedPassword, adminUserType.id]
    );
    adminUser = adminResult.rows[0];

    // Get applications
    const appsResult = await global.testDb.query(
      "SELECT * FROM applications WHERE slug IN ('tq', 'pm')"
    );
    tqApplication = appsResult.rows.find(app => app.slug === 'tq');
    pmApplication = appsResult.rows.find(app => app.slug === 'pm');

    // Create tenant applications with seat limits
    await global.testDb.query(
      `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used, active)
       VALUES ($1, $2, $3, 'active', 5, 0, true)`,
      [tenant.subdomain, tenant.id, tqApplication.id]
    );

    await global.testDb.query(
      `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, user_limit, seats_used, active)
       VALUES ($1, $2, $3, 'active', 3, 2, true)`,
      [tenant.subdomain, tenant.id, pmApplication.id]
    );
  });

  beforeEach(async () => {
    // Reset seat counts and clean any residual user access data
    await global.testDb.query(
      'DELETE FROM user_application_access WHERE user_id IN ($1, $2)',
      [user.id, adminUser.id]
    );
    
    // Reset seat counts to expected values
    await global.testDb.query(
      'UPDATE tenant_applications SET seats_used = 0 WHERE tenant_id_fk = $1 AND application_id = $2',
      [tenant.id, tqApplication.id]
    );
    
    await global.testDb.query(
      'UPDATE tenant_applications SET seats_used = 2 WHERE tenant_id_fk = $1 AND application_id = $2',
      [tenant.id, pmApplication.id]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await global.testDb.query('DELETE FROM application_pricing WHERE application_id IN (SELECT id FROM applications WHERE slug IN (\'tq\', \'pm\'))');
    await global.testDb.query('DELETE FROM tenant_applications WHERE tenant_id_fk = $1', [tenant.id]);
    await global.testDb.query('DELETE FROM user_application_access WHERE user_id IN ($1, $2)', [user.id, adminUser.id]);
    await global.testDb.query('DELETE FROM users WHERE id IN ($1, $2)', [user.id, adminUser.id]);
    await global.testDb.query('DELETE FROM tenants WHERE id = $1', [tenant.id]);
    await global.testDb.query('DROP SCHEMA IF EXISTS tenant_pricing_test_clinic CASCADE');
  });

  describe('ApplicationPricing Model Tests', () => {
    test('should create pricing matrix for TQ application', async () => {
      const ApplicationPricing = require('@server/infra/models/ApplicationPricing');
      
      const pricing = await ApplicationPricing.create({
        applicationId: tqApplication.id,
        userTypeId: operationsUserType.id,
        price: 35.00,
        currency: 'BRL',
        billingCycle: 'monthly'
      });

      expect(pricing).toBeDefined();
      expect(parseFloat(pricing.price)).toBe(35.00);
      expect(pricing.currency).toBe('BRL');
      expect(pricing.billingCycle).toBe('monthly');
      expect(pricing.applicationId).toBe(tqApplication.id);
      expect(pricing.userTypeId).toBe(operationsUserType.id);
    });

    test('should get current pricing for application and user type', async () => {
      const ApplicationPricing = require('@server/infra/models/ApplicationPricing');
      
      // Should use the seeded pricing from migration
      const currentPricing = await ApplicationPricing.getCurrentPrice(tqApplication.id, operationsUserType.id);
      
      expect(currentPricing).toBeDefined();
      expect(currentPricing.applicationId).toBe(tqApplication.id);
      expect(currentPricing.userTypeId).toBe(operationsUserType.id);
      expect(parseFloat(currentPricing.price)).toBe(35.00); // From migration seed
    });

    test('should schedule future pricing', async () => {
      const ApplicationPricing = require('@server/infra/models/ApplicationPricing');
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const scheduledPricing = await ApplicationPricing.schedulePrice(
        tqApplication.id,
        managerUserType.id,
        65.00,
        futureDate,
        { currency: 'BRL', billingCycle: 'monthly' }
      );

      expect(scheduledPricing).toBeDefined();
      expect(parseFloat(scheduledPricing.price)).toBe(65.00);
      expect(scheduledPricing.validFrom.getTime()).toBe(futureDate.getTime());
    });
  });

  describe('Application Pricing API Endpoints', () => {
    let adminToken;

    beforeAll(() => {
      adminToken = generateTestToken({
        userId: adminUser.id,
        tenantId: tenant.id,
        allowedApps: ['tq', 'pm'],
        role: 'admin',
        platformRole: 'internal_admin'
      });
    });

    test('should get pricing matrix for application', async () => {
      // First ensure pricing data exists from migration
      const ApplicationPricing = require('@server/infra/models/ApplicationPricing');
      const existingPricing = await ApplicationPricing.getCurrentPrice(tqApplication.id, operationsUserType.id);
      
      if (!existingPricing) {
        // Create pricing if migration didn't seed it
        await ApplicationPricing.create({
          applicationId: tqApplication.id,
          userTypeId: operationsUserType.id,
          price: 35.00,
          currency: 'BRL',
          billingCycle: 'monthly'
        });
      }

      const response = await request(app)
        .get(`${INTERNAL_API}/applications/${tqApplication.id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.applicationId).toBe(tqApplication.id);
      expect(response.body.data.pricing).toBeInstanceOf(Array);
      expect(response.body.data.pricing.length).toBeGreaterThan(0);
      
      // Should include user type information
      const operationsPricing = response.body.data.pricing.find(p => p.userTypeSlug === 'operations');
      expect(operationsPricing).toBeDefined();
      expect(parseFloat(operationsPricing.price)).toBe(35.00);
    });

    test('should create new pricing entry', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/applications/${pmApplication.id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          userTypeId: adminUserType.id,
          price: 85.00,
          currency: 'BRL',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(201);
      expect(response.body.meta.code).toBe('PRICING_CREATED');
      expect(parseFloat(response.body.data.pricing.price)).toBe(85.00);
      expect(response.body.data.pricing.userTypeId).toBe(adminUserType.id);
    });

    test('should reject negative pricing', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/applications/${pmApplication.id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          userTypeId: operationsUserType.id,
          price: -10.00,
          currency: 'BRL',
          billingCycle: 'monthly'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toContain('negative');
    });
  });

  describe('Grant/Revoke with Pricing Snapshots', () => {
    let userToken, adminToken;

    beforeAll(() => {
      userToken = generateTestToken({
        userId: user.id,
        tenantId: tenant.id,
        allowedApps: [],
        role: 'operations'
      });

      adminToken = generateTestToken({
        userId: adminUser.id,
        tenantId: tenant.id,
        allowedApps: ['tq', 'pm'],
        role: 'admin',
        platformRole: 'internal_admin'
      });
    });

    test('should grant access with pricing snapshot', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/users/${user.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'tq',
          roleInApp: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body.meta.code).toBe('USER_APP_ACCESS_GRANTED');
      expect(response.body.data.pricing).toBeDefined();
      expect(parseFloat(response.body.data.pricing.price)).toBe(35.00); // Operations user price for TQ
      expect(response.body.data.pricing.currency).toBe('BRL');
      expect(response.body.data.pricing.billingCycle).toBe('monthly');
      expect(response.body.data.seatsUsed).toBe(1);

      // Verify snapshot was stored in database
      const accessResult = await global.testDb.query(
        'SELECT * FROM user_application_access WHERE user_id = $1 AND application_id = $2',
        [user.id, tqApplication.id]
      );
      
      expect(accessResult.rows.length).toBe(1);
      const access = accessResult.rows[0];
      expect(parseFloat(access.price_snapshot)).toBe(35.00);
      expect(access.currency_snapshot).toBe('BRL');
      expect(access.user_type_id_snapshot).toBe(operationsUserType.id);
      expect(access.granted_cycle).toBe('monthly');
    });

    test('should reject grant when seat limit exceeded', async () => {
      // PM app has user_limit=3 and seats_used=2 already, so one more should be allowed
      const response1 = await request(app)
        .post(`${INTERNAL_API}/users/${user.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'pm'
        });

      expect(response1.status).toBe(201);
      expect(response1.body.data.seatsUsed).toBe(3);

      // Now try to grant to admin user - should be rejected (seat limit = 3, would become 4)
      const response2 = await request(app)
        .post(`${INTERNAL_API}/users/${adminUser.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'pm'
        });

      expect(response2.status).toBe(403);
      expect(response2.body.error).toBe('Seat Limit Exceeded');
      expect(response2.body.message).toContain('seat limit of 3 reached');
    });

    test('should reject grant when no pricing configured', async () => {
      // Create a new application without pricing using unique timestamp
      const timestamp = Date.now();
      const uniqueSlug = `test_app_${timestamp}`;
      const newAppResult = await global.testDb.query(
        `INSERT INTO applications (name, slug, description, status, active)
         VALUES ($1, $2, 'Test application without pricing', 'active', true)
         RETURNING *`,
        [`Test App ${timestamp}`, uniqueSlug]
      );
      const newApp = newAppResult.rows[0];

      // Create tenant license for the app
      await global.testDb.query(
        `INSERT INTO tenant_applications (tenant_id, tenant_id_fk, application_id, status, active)
         VALUES ($1, $2, $3, 'active', true)`,
        [tenant.subdomain, tenant.id, newApp.id]
      );

      const response = await request(app)
        .post(`${INTERNAL_API}/users/${user.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: uniqueSlug
        });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Pricing Not Configured');

      // Cleanup
      await global.testDb.query('DELETE FROM tenant_applications WHERE application_id = $1', [newApp.id]);
      await global.testDb.query('DELETE FROM applications WHERE id = $1', [newApp.id]);
    });

    test('should revoke access and decrement seat count', async () => {
      // First grant access to TQ for the user
      const grantResponse = await request(app)
        .post(`${INTERNAL_API}/users/${user.id}/apps/grant`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenant.subdomain)
        .send({
          applicationSlug: 'tq'
        });
      expect(grantResponse.status).toBe(201);

      // Get seat count after grant
      const beforeResult = await global.testDb.query(
        'SELECT seats_used FROM tenant_applications WHERE tenant_id_fk = $1 AND application_id = $2',
        [tenant.id, tqApplication.id]
      );
      const seatsBefore = beforeResult.rows[0].seats_used;
      expect(seatsBefore).toBe(1); // Should be 1 after the grant

      // Now revoke the access
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
      const afterResult = await global.testDb.query(
        'SELECT seats_used FROM tenant_applications WHERE tenant_id_fk = $1 AND application_id = $2',
        [tenant.id, tqApplication.id]
      );
      const seatsAfter = afterResult.rows[0].seats_used;
      expect(seatsAfter).toBe(0); // Should be 0 after revoking the single access

      // Verify access is revoked in database
      const accessResult = await global.testDb.query(
        'SELECT * FROM user_application_access WHERE user_id = $1 AND application_id = $2',
        [user.id, tqApplication.id]
      );
      expect(accessResult.rows[0].is_active).toBe(false);
    });
  });

  describe('Billing Summary Integration', () => {
    test('should calculate billing summary with snapshots', async () => {
      const ApplicationPricing = require('@server/infra/models/ApplicationPricing');
      
      // Grant access to both users for TQ (different user types)
      await global.testDb.query(
        `INSERT INTO user_application_access 
         (user_id, application_id, tenant_id_fk, tenant_id, is_active, active, 
          price_snapshot, currency_snapshot, user_type_id_snapshot, granted_cycle)
         VALUES 
         ($1, $2, $3, $4, true, true, 35.00, 'BRL', $5, 'monthly'),
         ($6, $2, $3, $4, true, true, 80.00, 'BRL', $7, 'monthly')`,
        [user.id, tqApplication.id, tenant.id, tenant.subdomain, operationsUserType.id,
         adminUser.id, adminUserType.id]
      );

      const billingSummary = await ApplicationPricing.getBillingSummary(tenant.id);
      
      expect(billingSummary).toBeInstanceOf(Array);
      const tqSummary = billingSummary.find(summary => summary.application_slug === 'tq');
      
      expect(tqSummary).toBeDefined();
      expect(parseInt(tqSummary.active_seats)).toBe(2);
      expect(parseFloat(tqSummary.total_amount)).toBe(115.00); // 35.00 + 80.00
      expect(tqSummary.currency).toBe('BRL');
    });
  });
});