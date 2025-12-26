/**
 * TQ CLINICAL REPORTS API TESTS
 *
 * Tests for clinical report management endpoints:
 * - GET /clinical-reports (list)
 * - GET /clinical-reports/:id (single)
 * - POST /clinical-reports (create)
 * - PUT /clinical-reports/:id (update)
 * - DELETE /clinical-reports/:id (delete)
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
  createTestClinicalReport,
  cleanupTQSchema,
} = require('../../test-data-helper');

describe('TQ Clinical Reports API', () => {
  let testTenant;
  let testUser;
  let testToken;
  let testPatient;
  let testSession;
  let tqApp;
  let createdReportId;

  beforeAll(async () => {
    // Get TQ app reference
    tqApp = require('@server/tq-api');

    // Create test tenant
    testTenant = await createTestTenant({
      name: 'TQ Reports Test Clinic',
      subdomain: 'tq_reports_' + Date.now(),
    });

    // Create TQ schema for tenant
    await createTQSchema(testTenant.schema_name);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'tq_reports_test_' + Date.now() + '@test.com',
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

    // Create test patient and session
    testPatient = await createTestPatient(testTenant.schema_name, {
      firstName: 'Report',
      lastName: 'TestPatient',
    });

    testSession = await createTestSession(
      testTenant.schema_name,
      testPatient.id
    );

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

  describe('POST /api/tq/v1/clinical-reports', () => {
    it('should create a new clinical report', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/clinical-reports')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSession.id,
          patientId: testPatient.id,
          title: 'Initial Consultation Report',
          content: '<p>Clinical report content</p>',
        });

      expect(res.status).toBe(201);
      expect(res.body.meta.code).toBe('CLINICAL_REPORT_CREATED');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Initial Consultation Report');
      expect(res.body.data.sessionId).toBe(testSession.id);
      expect(res.body.data.patientId).toBe(testPatient.id);

      createdReportId = res.body.data.id;
    });

    it('should fail without session ID', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/clinical-reports')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          patientId: testPatient.id,
          title: 'Report without session',
          content: '<p>Content</p>',
        });

      expect(res.status).toBe(400);
    });

    it('should fail without patient ID', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/clinical-reports')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSession.id,
          title: 'Report without patient',
          content: '<p>Content</p>',
        });

      expect(res.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/clinical-reports')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          sessionId: testSession.id,
          patientId: testPatient.id,
          title: 'Unauthorized report',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tq/v1/clinical-reports', () => {
    beforeAll(async () => {
      // Create additional reports
      await createTestClinicalReport(
        testTenant.schema_name,
        testSession.id,
        testPatient.id,
        { title: 'Report 1' }
      );
      await createTestClinicalReport(
        testTenant.schema_name,
        testSession.id,
        testPatient.id,
        { title: 'Report 2' }
      );
    });

    it('should list all clinical reports', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/clinical-reports')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by patient ID', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/clinical-reports')
        .query({ patientId: testPatient.id })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((report) => {
        expect(report.patientId).toBe(testPatient.id);
      });
    });

    it('should filter by session ID', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/clinical-reports')
        .query({ sessionId: testSession.id })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((report) => {
        expect(report.sessionId).toBe(testSession.id);
      });
    });

    it('should support pagination', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/clinical-reports')
        .query({ limit: 1, offset: 0 })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/tq/v1/clinical-reports/:id', () => {
    it('should return a single clinical report', async () => {
      const res = await request(tqApp)
        .get(`/api/tq/v1/clinical-reports/${createdReportId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', createdReportId);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('content');
      expect(res.body.data).toHaveProperty('sessionId');
      expect(res.body.data).toHaveProperty('patientId');
    });

    it('should return 404 for non-existent report', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .get(`/api/tq/v1/clinical-reports/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tq/v1/clinical-reports/:id', () => {
    it('should update report title', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/clinical-reports/${createdReportId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Updated Consultation Report',
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('CLINICAL_REPORT_UPDATED');
      expect(res.body.data.title).toBe('Updated Consultation Report');
    });

    it('should update report content', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/clinical-reports/${createdReportId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: '<p>Updated clinical report content</p>',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe(
        '<p>Updated clinical report content</p>'
      );
    });

    it('should return 404 for non-existent report', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .put(`/api/tq/v1/clinical-reports/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Will not update',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tq/v1/clinical-reports/:id', () => {
    let reportToDelete;

    beforeEach(async () => {
      reportToDelete = await createTestClinicalReport(
        testTenant.schema_name,
        testSession.id,
        testPatient.id,
        { title: 'Report to Delete' }
      );
    });

    it('should delete clinical report', async () => {
      const res = await request(tqApp)
        .delete(`/api/tq/v1/clinical-reports/${reportToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('CLINICAL_REPORT_DELETED');

      // Verify report is deleted
      const getRes = await request(tqApp)
        .get(`/api/tq/v1/clinical-reports/${reportToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent report', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .delete(`/api/tq/v1/clinical-reports/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });
});
