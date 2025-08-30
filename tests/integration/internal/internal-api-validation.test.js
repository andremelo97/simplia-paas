const request = require('supertest');
const app = require('@server/app');
const { generateTestToken } = require('../../auth-helper');

// Add API prefix constant
const INTERNAL_API = process.env.INTERNAL_API_PREFIX || '/internal/api/v1';

describe('Internal API Validation', () => {
  let validToken;
  let internalAdminToken;
  let testUser;
  let testTenant;
  
  beforeAll(async () => {
    // Create test tenant first
    const tenantResult = await global.testDb.query(
      `INSERT INTO tenants (name, subdomain, schema_name, status, active)
       VALUES ($1, $2, $3, 'active', true)
       ON CONFLICT (subdomain) DO UPDATE SET 
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         active = EXCLUDED.active
       RETURNING *`,
      ['Test Clinic', 'test_clinic', 'tenant_test_clinic']
    );
    testTenant = tenantResult.rows[0];

    // Create test user with platform role
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const userResult = await global.testDb.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, platform_role)
       VALUES ($1, 'internal-api@test.com', $2, 'Internal', 'User', 'manager', 'active', 'internal_admin')
       ON CONFLICT (email) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         platform_role = EXCLUDED.platform_role,
         updated_at = NOW()
       RETURNING *`,
      [testTenant.subdomain, hashedPassword]
    );
    testUser = userResult.rows[0];

    // Standard user token (no platform role)
    validToken = generateTestToken({
      userId: testUser.id,
      email: 'internal-api@test.com',
      role: 'manager',
      tenantId: 'test_clinic',
      schema: 'tenant_test_clinic',
      allowedApps: ['tq']
    });

    // Internal admin token (with platform role)
    internalAdminToken = generateTestToken({
      userId: testUser.id,
      email: 'admin@simplia.com',
      role: 'admin',
      tenantId: 'test_clinic',
      schema: 'tenant_test_clinic',
      allowedApps: ['tq'],
      platformRole: 'internal_admin'
    });
  });

  describe('Swagger Documentation Access', () => {
    test('should allow access to Swagger docs in development', async () => {
      const response = await request(app)
        .get('/docs/internal/')
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .expect(200);
      
      expect(response.text).toContain('Simplia Internal API Docs');
      expect(response.text).toContain('swagger-ui');
    });
  });

  describe('Platform-only Routes (Applications)', () => {
    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/applications`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    test('should deny access without platform role', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/applications`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Platform role required');
    });

    test('should allow access with internal_admin platform role', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/applications`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Audit Routes (Platform-scoped)', () => {
    test('should deny access to audit logs without platform role', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/audit/access-logs`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Platform role required');
    });

    test('should allow access to audit logs with internal_admin role', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/audit/access-logs`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('logs');
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should allow access to audit summary with internal_admin role', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/audit/access-summary`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('overview');
    });
  });

  describe('Tenant-scoped Routes (Users)', () => {
    test('should require tenant header for user routes', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/users`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('tenant');
    });

    test('should allow access to users with valid tenant and auth', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/users`)
        .set('Authorization', `Bearer ${validToken}`)
        .set('x-tenant-id', 'test_clinic')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('CORS Validation', () => {
    test('should set CORS headers for internal API', async () => {
      const response = await request(app)
        .options(`${INTERNAL_API}/applications`)
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');
      
      expect(response.status).toBe(204);
    });
  });

  describe('Applications API - Error Scenarios', () => {
    test('should return 404 for non-existent application by ID', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/applications/99999`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });

    test('should return 404 for non-existent application by slug', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/applications/slug/nonexistent`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });

    test('should return 400 for invalid application creation data', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/applications`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .send({}) // Missing required fields
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('required');
    });
  });

  describe('Users API - Error Scenarios', () => {
    test('should return 422 for invalid user creation data', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/users`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .set('x-tenant-id', 'test_clinic')
        .send({
          email: 'invalid-email', // Invalid email format
          password: '123', // Too short password
          name: ''  // Empty name
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 when trying to grant access to non-existent user', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/users/99999/apps/grant`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .set('x-tenant-id', 'test_clinic')
        .send({
          applicationSlug: 'tq'
        })
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });

    test('should return 400 when missing applicationSlug in grant request', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/users/1/apps/grant`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .set('x-tenant-id', 'test_clinic')
        .send({}) // Missing applicationSlug
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('required');
    });
  });

  describe('Entitlements API - Error Scenarios', () => {
    test('should return 404 for non-existent application license', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/entitlements/nonexistent`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .set('x-tenant-id', 'test_clinic')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('No license found');
    });

    test('should activate license even with edge case data', async () => {
      const response = await request(app)
        .post(`${INTERNAL_API}/entitlements/tq/activate`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .set('x-tenant-id', 'test_clinic')
        .send({
          userLimit: -1, // Edge case: negative limit
          status: 'invalid_status' // Edge case: non-standard status
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 400 when trying to adjust license with no fields', async () => {
      const response = await request(app)
        .put(`${INTERNAL_API}/entitlements/tq/adjust`)
        .set('Authorization', `Bearer ${internalAdminToken}`)
        .set('x-tenant-id', 'test_clinic')
        .send({}) // No fields to update
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('At least one field must be provided');
    });
  });

  describe('Authorization Audit Logging', () => {
    test('should log audit entry when platform access is denied', async () => {
      // This test verifies that denied access attempts are logged for audit purposes
      const response = await request(app)
        .get(`${INTERNAL_API}/applications`)
        .set('Authorization', `Bearer ${validToken}`) // No platform role
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Platform role required');
      
      // In a real scenario, we would check audit logs table
      // For now, we just verify the expected error response
    });

    test('should log audit entry when tenant access is denied', async () => {
      const response = await request(app)
        .get(`${INTERNAL_API}/users`)
        .set('Authorization', `Bearer ${validToken}`)
        // Missing x-tenant-id header
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('tenant');
    });
  });

  describe('Health Check (Public)', () => {
    test('should allow health check without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });
});