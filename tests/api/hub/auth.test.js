/**
 * HUB AUTH API TESTS
 *
 * Tests for authentication endpoints:
 * - POST /auth/login
 * - POST /auth/refresh
 * - POST /auth/logout
 * - POST /auth/change-password
 * - GET /auth/me
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('@server/app');
const {
  generateTestToken,
  generateExpiredToken,
  generatePlatformAdminToken,
} = require('../../auth-helper');
const {
  createTestTenant,
  createTestUser,
  createTestApplication,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
} = require('../../test-data-helper');

describe('Hub Auth API', () => {
  let testTenant;
  let testUser;
  let testApp;
  const testPassword = 'TestPassword123';
  const testPasswordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMye5XzNcXzgzXvlhRaD.X.YJYnQlLKRfxK'; // 'password'

  beforeAll(async () => {
    // Create test tenant
    testTenant = await createTestTenant({
      name: 'Auth Test Clinic',
      subdomain: 'auth_test_' + Date.now(),
    });

    // Hash password for test user
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'auth_test_' + Date.now() + '@test.com',
      firstName: 'Auth',
      lastName: 'Tester',
      passwordHash: passwordHash,
      role: 'admin',
    });

    // Create test application and grant access
    testApp = await createTestApplication({
      name: 'Test App',
      slug: 'test_app_' + Date.now(),
    });

    await createTestLicense(testTenant.id, testApp.id, {
      userLimit: 10,
      seatsUsed: 1,
    });

    await createTestUserAccess(testUser.id, testTenant.id, testApp.id, {
      roleInApp: 'admin',
    });
  });

  afterAll(async () => {
    if (testTenant?.id) {
      await cleanupTestTenant(testTenant.id, testTenant.schema_name);
    }
  });

  describe('POST /internal/api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/login')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          email: testUser.email,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('LOGIN_SUCCESS');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(testUser.email);

      // Verify JWT contains numeric tenantId
      const decoded = jwt.decode(res.body.data.token);
      expect(typeof decoded.tenantId).toBe('number');
      expect(decoded.tenantId).toBe(testTenant.id);
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/login')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/login')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          email: 'nonexistent@test.com',
          password: testPassword,
        });

      expect(res.status).toBe(401);
    });

    it('should fail without x-tenant-id header', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testPassword,
        });

      expect(res.status).toBe(400);
    });

    it('should fail with missing email or password', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/login')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          email: testUser.email,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should return JWT with timezone and locale', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/login')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          email: testUser.email,
          password: testPassword,
        });

      expect(res.status).toBe(200);

      const decoded = jwt.decode(res.body.data.token);
      expect(decoded).toHaveProperty('timezone');
      expect(decoded).toHaveProperty('locale');
    });
  });

  describe('POST /internal/api/v1/auth/refresh', () => {
    it('should refresh valid token', async () => {
      // First login to get a valid token
      const loginRes = await request(app)
        .post('/internal/api/v1/auth/login')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          email: testUser.email,
          password: testPassword,
        });

      const originalToken = loginRes.body.data.token;

      // Wait a moment to ensure different iat
      await new Promise((r) => setTimeout(r, 1000));

      const res = await request(app)
        .post('/internal/api/v1/auth/refresh')
        .set('x-tenant-id', testTenant.id.toString())
        .send({ token: originalToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail with expired token', async () => {
      const expiredToken = generateExpiredToken({
        userId: testUser.id,
        tenantId: testTenant.id,
      });

      const res = await request(app)
        .post('/internal/api/v1/auth/refresh')
        .set('x-tenant-id', testTenant.id.toString())
        .send({ token: expiredToken });

      expect(res.status).toBe(401);
    });

    it('should fail without token in body', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/refresh')
        .set('x-tenant-id', testTenant.id.toString())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Token is required');
    });
  });

  describe('POST /internal/api/v1/auth/change-password', () => {
    let changePasswordUser;
    const originalPassword = 'OriginalPass123';

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash(originalPassword, 10);
      changePasswordUser = await createTestUser(testTenant.id, {
        email: 'change_pwd_' + Date.now() + '@test.com',
        firstName: 'Change',
        lastName: 'Password',
        passwordHash: passwordHash,
        role: 'admin',
      });
    });

    it('should change password successfully', async () => {
      const token = generateTestToken({
        userId: changePasswordUser.id,
        tenantId: testTenant.id,
        email: changePasswordUser.email,
        schema: testTenant.schema_name,
      });

      const res = await request(app)
        .post('/internal/api/v1/auth/change-password')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: originalPassword,
          newPassword: 'NewPassword456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.code).toBe('PASSWORD_CHANGED');
    });

    it('should fail with wrong current password', async () => {
      const token = generateTestToken({
        userId: changePasswordUser.id,
        tenantId: testTenant.id,
        email: changePasswordUser.email,
        schema: testTenant.schema_name,
      });

      const res = await request(app)
        .post('/internal/api/v1/auth/change-password')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongCurrentPassword',
          newPassword: 'NewPassword456',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('should fail with short new password', async () => {
      const token = generateTestToken({
        userId: changePasswordUser.id,
        tenantId: testTenant.id,
        email: changePasswordUser.email,
        schema: testTenant.schema_name,
      });

      const res = await request(app)
        .post('/internal/api/v1/auth/change-password')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: originalPassword,
          newPassword: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('at least 6 characters');
    });

    it('should fail when new password equals current', async () => {
      const token = generateTestToken({
        userId: changePasswordUser.id,
        tenantId: testTenant.id,
        email: changePasswordUser.email,
        schema: testTenant.schema_name,
      });

      const res = await request(app)
        .post('/internal/api/v1/auth/change-password')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: originalPassword,
          newPassword: originalPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('different');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/change-password')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          currentPassword: originalPassword,
          newPassword: 'NewPassword456',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /internal/api/v1/auth/me', () => {
    it('should return user profile with allowed apps', async () => {
      const token = generateTestToken({
        userId: testUser.id,
        tenantId: testTenant.id,
        email: testUser.email,
        schema: testTenant.schema_name,
        role: 'admin',
      });

      const res = await request(app)
        .get('/internal/api/v1/auth/me')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('role');
      expect(res.body.data).toHaveProperty('allowedApps');
      expect(res.body.data).toHaveProperty('tenant');
      expect(res.body.data.tenant).toHaveProperty('name');
      expect(res.body.data.tenant).toHaveProperty('slug');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/internal/api/v1/auth/me')
        .set('x-tenant-id', testTenant.id.toString());

      expect(res.status).toBe(401);
    });

    it('should fail without x-tenant-id header', async () => {
      const token = generateTestToken({
        userId: testUser.id,
        tenantId: testTenant.id,
      });

      const res = await request(app)
        .get('/internal/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /internal/api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const token = generateTestToken({
        userId: testUser.id,
        tenantId: testTenant.id,
        email: testUser.email,
        schema: testTenant.schema_name,
      });

      const res = await request(app)
        .post('/internal/api/v1/auth/logout')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/internal/api/v1/auth/logout')
        .set('x-tenant-id', testTenant.id.toString());

      expect(res.status).toBe(401);
    });
  });
});
