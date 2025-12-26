/**
 * HUB ENTITLEMENTS API TESTS
 *
 * Tests for entitlements/licensing endpoints:
 * - GET /entitlements
 *
 * Tests verify:
 * - License listing with users
 * - Seat counting accuracy
 * - Expired license status computation
 * - Tenant isolation
 */

const request = require('supertest');
const app = require('@server/app');
const { generateTestToken } = require('../../auth-helper');
const {
  createTestTenant,
  createTestUser,
  createTestApplication,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
  cleanupTestApplications,
} = require('../../test-data-helper');

describe('Hub Entitlements API', () => {
  let testTenant;
  let testUser;
  let testApp1;
  let testApp2;
  let testToken;

  beforeAll(async () => {
    // Create test tenant
    testTenant = await createTestTenant({
      name: 'Entitlements Test Clinic',
      subdomain: 'entitlements_test_' + Date.now(),
    });

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'entitlements_test_' + Date.now() + '@test.com',
      firstName: 'Entitlements',
      lastName: 'Tester',
      role: 'admin',
    });

    // Create test applications
    testApp1 = await createTestApplication({
      name: 'App One',
      slug: 'app_one_' + Date.now(),
    });

    testApp2 = await createTestApplication({
      name: 'App Two',
      slug: 'app_two_' + Date.now(),
    });

    // Create licenses for both apps
    await createTestLicense(testTenant.id, testApp1.id, {
      userLimit: 10,
      seatsUsed: 1,
      status: 'active',
    });

    await createTestLicense(testTenant.id, testApp2.id, {
      userLimit: 5,
      seatsUsed: 0,
      status: 'active',
    });

    // Grant user access to app1 only
    await createTestUserAccess(testUser.id, testTenant.id, testApp1.id, {
      roleInApp: 'admin',
    });

    // Generate token
    testToken = generateTestToken({
      userId: testUser.id,
      tenantId: testTenant.id,
      email: testUser.email,
      schema: testTenant.schema_name,
      role: 'admin',
    });
  });

  afterAll(async () => {
    if (testTenant?.id) {
      await cleanupTestTenant(testTenant.id, testTenant.schema_name);
    }
    if (testApp1?.id || testApp2?.id) {
      await cleanupTestApplications([testApp1?.id, testApp2?.id].filter(Boolean));
    }
  });

  describe('GET /internal/api/v1/entitlements', () => {
    it('should return licenses with users for tenant', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('ENTITLEMENTS_OK');
      expect(res.body.data).toHaveProperty('licenses');
      expect(res.body.data).toHaveProperty('summary');
      expect(Array.isArray(res.body.data.licenses)).toBe(true);
    });

    it('should include correct license properties', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);

      const license = res.body.data.licenses.find(
        (l) => l.applicationId === testApp1.id
      );
      expect(license).toBeDefined();
      expect(license).toHaveProperty('applicationId');
      expect(license).toHaveProperty('slug');
      expect(license).toHaveProperty('name');
      expect(license).toHaveProperty('status');
      expect(license).toHaveProperty('seatsUsed');
      expect(license).toHaveProperty('seatsPurchased');
      expect(license).toHaveProperty('users');
    });

    it('should return users array for each license', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);

      const license = res.body.data.licenses.find(
        (l) => l.applicationId === testApp1.id
      );
      expect(license.users).toBeInstanceOf(Array);
      expect(license.users.length).toBeGreaterThanOrEqual(1);

      // Check user properties
      const user = license.users.find((u) => u.email === testUser.email);
      expect(user).toBeDefined();
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('grantedAt');
    });

    it('should compute seats_used from actual user count', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);

      const license = res.body.data.licenses.find(
        (l) => l.applicationId === testApp1.id
      );
      // seatsUsed should match users array length
      expect(license.seatsUsed).toBe(license.users.length);
    });

    it('should return summary with total counts', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);

      const { summary } = res.body.data;
      expect(summary).toHaveProperty('apps');
      expect(summary).toHaveProperty('seatsUsed');
      expect(typeof summary.apps).toBe('number');
      expect(typeof summary.seatsUsed).toBe('number');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', testTenant.id.toString());

      expect(res.status).toBe(401);
    });

    it('should fail without x-tenant-id header', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Expired License Status Computation', () => {
    let expiredTenant;
    let expiredUser;
    let expiredApp;
    let expiredToken;

    beforeAll(async () => {
      // Create tenant with expired license
      expiredTenant = await createTestTenant({
        name: 'Expired Test Clinic',
        subdomain: 'expired_test_' + Date.now(),
      });

      expiredUser = await createTestUser(expiredTenant.id, {
        email: 'expired_user_' + Date.now() + '@test.com',
        role: 'admin',
      });

      expiredApp = await createTestApplication({
        name: 'Expired App',
        slug: 'expired_app_' + Date.now(),
      });

      // Create license with past expiry date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

      await createTestLicense(expiredTenant.id, expiredApp.id, {
        status: 'active',
        expiryDate: pastDate.toISOString(),
      });

      await createTestUserAccess(
        expiredUser.id,
        expiredTenant.id,
        expiredApp.id,
        { roleInApp: 'admin' }
      );

      expiredToken = generateTestToken({
        userId: expiredUser.id,
        tenantId: expiredTenant.id,
        email: expiredUser.email,
        schema: expiredTenant.schema_name,
        role: 'admin',
      });
    });

    afterAll(async () => {
      if (expiredTenant?.id) {
        await cleanupTestTenant(expiredTenant.id, expiredTenant.schema_name);
      }
      if (expiredApp?.id) {
        await cleanupTestApplications([expiredApp.id]);
      }
    });

    it('should compute expired status when expires_at is in the past', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', expiredTenant.id.toString())
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(200);

      const license = res.body.data.licenses.find(
        (l) => l.applicationId === expiredApp.id
      );
      expect(license).toBeDefined();
      expect(license.status).toBe('expired');
    });
  });

  describe('Tenant Isolation', () => {
    let otherTenant;
    let otherUser;
    let otherToken;

    beforeAll(async () => {
      // Create another tenant
      otherTenant = await createTestTenant({
        name: 'Other Clinic',
        subdomain: 'other_clinic_' + Date.now(),
      });

      otherUser = await createTestUser(otherTenant.id, {
        email: 'other_user_' + Date.now() + '@test.com',
        role: 'admin',
      });

      otherToken = generateTestToken({
        userId: otherUser.id,
        tenantId: otherTenant.id,
        email: otherUser.email,
        schema: otherTenant.schema_name,
        role: 'admin',
      });
    });

    afterAll(async () => {
      if (otherTenant?.id) {
        await cleanupTestTenant(otherTenant.id, otherTenant.schema_name);
      }
    });

    it('should not return licenses from other tenants', async () => {
      const res = await request(app)
        .get('/internal/api/v1/entitlements')
        .set('x-tenant-id', otherTenant.id.toString())
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);

      // Other tenant should not see testApp1 or testApp2 licenses
      const hasTestApp1 = res.body.data.licenses.some(
        (l) => l.applicationId === testApp1?.id
      );
      const hasTestApp2 = res.body.data.licenses.some(
        (l) => l.applicationId === testApp2?.id
      );

      expect(hasTestApp1).toBe(false);
      expect(hasTestApp2).toBe(false);
    });
  });
});
