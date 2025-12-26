/**
 * TQ SESSIONS API TESTS
 *
 * Tests for session management endpoints:
 * - GET /sessions (list)
 * - GET /sessions/:id (single)
 * - POST /sessions (create)
 * - PUT /sessions/:id (update)
 * - DELETE /sessions/:id (delete)
 */

const request = require('supertest');
const { generateTestToken } = require('../../auth-helper');
const {
  createTestTenant,
  createTestUser,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
  createTQSchema,
  createTestPatient,
  createTestSession,
  createTestQuote,
  createTestClinicalReport,
  cleanupTQSchema,
} = require('../../test-data-helper');

describe('TQ Sessions API', () => {
  let testTenant;
  let testUser;
  let testToken;
  let testPatient;
  let tqApp;
  let createdSessionId;

  beforeAll(async () => {
    // Get TQ app reference
    tqApp = require('@server/tq-api');

    // Create test tenant
    testTenant = await createTestTenant({
      name: 'TQ Sessions Test Clinic',
      subdomain: 'tq_sessions_' + Date.now(),
    });

    // Create TQ schema for tenant
    await createTQSchema(testTenant.schema_name);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'tq_sessions_test_' + Date.now() + '@test.com',
      role: 'admin',
    });

    // Get or create TQ application
    let tqApp_db = await global.testDb.query(
      "SELECT * FROM applications WHERE slug = 'tq' LIMIT 1"
    );
    if (tqApp_db.rows.length === 0) {
      tqApp_db = await global.testDb.query(
        `INSERT INTO applications (name, slug, description, version, status, active)
         VALUES ('Transcription Quote', 'tq', 'TQ App', '1.0.0', 'active', true)
         RETURNING *`
      );
    }
    const tqAppId = tqApp_db.rows[0].id;

    await createTestLicense(testTenant.id, tqAppId, {
      userLimit: 10,
      seatsUsed: 1,
    });

    await createTestUserAccess(testUser.id, testTenant.id, tqAppId, {
      roleInApp: 'admin',
    });

    // Create test patient
    testPatient = await createTestPatient(testTenant.schema_name, {
      firstName: 'Session',
      lastName: 'TestPatient',
    });

    // Generate token with TQ access
    testToken = generateTestToken({
      userId: testUser.id,
      tenantId: testTenant.id,
      email: testUser.email,
      schema: testTenant.schema_name,
      role: 'admin',
      allowedApps: ['tq'],
    });
  });

  afterAll(async () => {
    if (testTenant?.schema_name) {
      await cleanupTQSchema(testTenant.schema_name);
    }
    if (testTenant?.id) {
      await cleanupTestTenant(testTenant.id, testTenant.schema_name);
    }
  });

  describe('POST /api/tq/v1/sessions', () => {
    it('should create a new session', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/sessions')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          patientId: testPatient.id,
          notes: 'Test session notes',
        });

      expect(res.status).toBe(201);
      expect(res.body.meta.code).toBe('SESSION_CREATED');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.patientId).toBe(testPatient.id);

      createdSessionId = res.body.data.id;
    });

    it('should create session with status', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/sessions')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          patientId: testPatient.id,
          status: 'in_progress',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('should fail without patient ID', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/sessions')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          notes: 'Session without patient',
        });

      expect(res.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/sessions')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          patientId: testPatient.id,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tq/v1/sessions', () => {
    beforeAll(async () => {
      // Create additional sessions
      await createTestSession(testTenant.schema_name, testPatient.id, {
        status: 'completed',
      });
      await createTestSession(testTenant.schema_name, testPatient.id, {
        status: 'draft',
      });
    });

    it('should list all sessions', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/sessions')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should filter by patient ID', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/sessions')
        .query({ patientId: testPatient.id })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((session) => {
        expect(session.patientId).toBe(testPatient.id);
      });
    });

    it('should include patient data when requested', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/sessions')
        .query({ includePatient: 'true' })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((session) => {
        expect(session).toHaveProperty('patient');
        if (session.patient) {
          expect(session.patient).toHaveProperty('firstName');
          expect(session.patient).toHaveProperty('lastName');
        }
      });
    });

    it('should support pagination', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/sessions')
        .query({ limit: 1, offset: 0 })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.limit).toBe(1);
    });
  });

  describe('GET /api/tq/v1/sessions/:id', () => {
    it('should return a single session', async () => {
      const res = await request(tqApp)
        .get(`/api/tq/v1/sessions/${createdSessionId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', createdSessionId);
      expect(res.body.data).toHaveProperty('patientId');
      expect(res.body.data).toHaveProperty('status');
    });

    it('should include patient when requested', async () => {
      const res = await request(tqApp)
        .get(`/api/tq/v1/sessions/${createdSessionId}`)
        .query({ includePatient: 'true' })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('patient');
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .get(`/api/tq/v1/sessions/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tq/v1/sessions/:id', () => {
    it('should update session status', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/sessions/${createdSessionId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'completed',
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('SESSION_UPDATED');
      expect(res.body.data.status).toBe('completed');
    });

    it('should update session notes', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/sessions/${createdSessionId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          notes: 'Updated session notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Updated session notes');
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .put(`/api/tq/v1/sessions/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'completed',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tq/v1/sessions/:id', () => {
    let sessionToDelete;

    beforeEach(async () => {
      // Create a session to delete
      sessionToDelete = await createTestSession(
        testTenant.schema_name,
        testPatient.id
      );
    });

    it('should delete session without quotes/reports', async () => {
      const res = await request(tqApp)
        .delete(`/api/tq/v1/sessions/${sessionToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('SESSION_DELETED');
    });

    it('should fail to delete session with quotes', async () => {
      // Create a quote for the session
      await createTestQuote(testTenant.schema_name, sessionToDelete.id);

      const res = await request(tqApp)
        .delete(`/api/tq/v1/sessions/${sessionToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SESSION_HAS_QUOTES');
    });

    it('should fail to delete session with clinical reports', async () => {
      // Create a clinical report for the session
      await createTestClinicalReport(
        testTenant.schema_name,
        sessionToDelete.id,
        testPatient.id
      );

      const res = await request(tqApp)
        .delete(`/api/tq/v1/sessions/${sessionToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SESSION_HAS_REPORTS');
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .delete(`/api/tq/v1/sessions/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });
});
