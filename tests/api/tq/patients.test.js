/**
 * TQ PATIENTS API TESTS
 *
 * Tests for patient management endpoints:
 * - GET /patients (list)
 * - GET /patients/:id (single)
 * - POST /patients (create)
 * - PUT /patients/:id (update)
 * - DELETE /patients/:id (delete)
 */

const request = require('supertest');
const tqApp = require('@server/tq-api');
const { generateTestToken } = require('../../auth-helper');
const {
  createTestTenant,
  createTestUser,
  createTestApplication,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
  createTQSchema,
  createTestPatient,
  createTestSession,
  cleanupTQSchema,
} = require('../../test-data-helper');

describe('TQ Patients API', () => {
  let testTenant;
  let testUser;
  let testToken;
  let tqApp;
  let createdPatientId;

  beforeAll(async () => {
    // Get TQ app reference
    tqApp = require('@server/tq-api');

    // Create test tenant
    testTenant = await createTestTenant({
      name: 'TQ Patients Test Clinic',
      subdomain: 'tq_patients_' + Date.now(),
    });

    // Create TQ schema for tenant
    await createTQSchema(testTenant.schema_name);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'tq_patients_test_' + Date.now() + '@test.com',
      firstName: 'TQ',
      lastName: 'Tester',
      role: 'admin',
    });

    // Create TQ application and grant access
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

  describe('POST /api/tq/v1/patients', () => {
    it('should create a new patient', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/patients')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
          phone: '+5511999999999',
          notes: 'Test patient notes',
        });

      expect(res.status).toBe(201);
      expect(res.body.meta.code).toBe('PATIENT_CREATED');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.lastName).toBe('Doe');
      expect(res.body.data.email).toBe('john.doe@test.com');

      createdPatientId = res.body.data.id;
    });

    it('should create patient with minimal data', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/patients')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          firstName: 'Jane',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.firstName).toBe('Jane');
    });

    it('should fail without authentication', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/patients')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          firstName: 'Test',
        });

      expect(res.status).toBe(401);
    });

    it('should fail without x-tenant-id header', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/patients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          firstName: 'Test',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tq/v1/patients', () => {
    beforeAll(async () => {
      // Create some test patients
      await createTestPatient(testTenant.schema_name, {
        firstName: 'Search',
        lastName: 'Patient1',
        email: 'search1@test.com',
      });
      await createTestPatient(testTenant.schema_name, {
        firstName: 'Search',
        lastName: 'Patient2',
        email: 'search2@test.com',
      });
    });

    it('should list all patients', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/patients')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('offset');
    });

    it('should support search by name', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/patients')
        .query({ search: 'Search' })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((patient) => {
        expect(
          patient.firstName.includes('Search') ||
            patient.lastName.includes('Search')
        ).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/patients')
        .query({ limit: 1, offset: 0 })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.limit).toBe(1);
      expect(res.body.meta.offset).toBe(0);
    });

    it('should fail without authentication', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/patients')
        .set('x-tenant-id', testTenant.id.toString());

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tq/v1/patients/:id', () => {
    it('should return a single patient', async () => {
      const res = await request(tqApp)
        .get(`/api/tq/v1/patients/${createdPatientId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', createdPatientId);
      expect(res.body.data).toHaveProperty('firstName');
      expect(res.body.data).toHaveProperty('lastName');
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .get(`/api/tq/v1/patients/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tq/v1/patients/:id', () => {
    it('should update patient data', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/patients/${createdPatientId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          firstName: 'Johnny',
          notes: 'Updated notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('PATIENT_UPDATED');
      expect(res.body.data.firstName).toBe('Johnny');
      expect(res.body.data.notes).toBe('Updated notes');
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .put(`/api/tq/v1/patients/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          firstName: 'Test',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tq/v1/patients/:id', () => {
    let patientToDelete;

    beforeEach(async () => {
      // Create a patient to delete
      patientToDelete = await createTestPatient(testTenant.schema_name, {
        firstName: 'Delete',
        lastName: 'Me',
      });
    });

    it('should delete patient without sessions', async () => {
      const res = await request(tqApp)
        .delete(`/api/tq/v1/patients/${patientToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('PATIENT_DELETED');

      // Verify patient is deleted
      const getRes = await request(tqApp)
        .get(`/api/tq/v1/patients/${patientToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(getRes.status).toBe(404);
    });

    it('should fail to delete patient with sessions', async () => {
      // Create a session for the patient
      await createTestSession(testTenant.schema_name, patientToDelete.id);

      const res = await request(tqApp)
        .delete(`/api/tq/v1/patients/${patientToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PATIENT_HAS_SESSIONS');
    });

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .delete(`/api/tq/v1/patients/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Tenant Isolation', () => {
    let otherTenant;
    let otherPatient;
    let otherToken;

    beforeAll(async () => {
      // Create another tenant
      otherTenant = await createTestTenant({
        name: 'Other Clinic',
        subdomain: 'other_tq_' + Date.now(),
      });

      await createTQSchema(otherTenant.schema_name);

      // Create patient in other tenant
      otherPatient = await createTestPatient(otherTenant.schema_name, {
        firstName: 'Other',
        lastName: 'Patient',
      });

      // Create user for other tenant
      const otherUser = await createTestUser(otherTenant.id, {
        email: 'other_' + Date.now() + '@test.com',
        role: 'admin',
      });

      otherToken = generateTestToken({
        userId: otherUser.id,
        tenantId: otherTenant.id,
        email: otherUser.email,
        schema: otherTenant.schema_name,
        allowedApps: ['tq'],
      });
    });

    afterAll(async () => {
      if (otherTenant?.schema_name) {
        await cleanupTQSchema(otherTenant.schema_name);
      }
      if (otherTenant?.id) {
        await cleanupTestTenant(otherTenant.id, otherTenant.schema_name);
      }
    });

    it('should not access patients from other tenant', async () => {
      // Try to access other tenant's patient
      const res = await request(tqApp)
        .get(`/api/tq/v1/patients/${otherPatient.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });

    it('should not list patients from other tenant', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/patients')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);

      // Should not find other tenant's patient
      const foundOther = res.body.data.some((p) => p.id === otherPatient.id);
      expect(foundOther).toBe(false);
    });
  });
});
