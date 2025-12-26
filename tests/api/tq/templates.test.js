/**
 * TQ TEMPLATES API TESTS
 *
 * Tests for template management endpoints:
 * - GET /templates (list)
 * - GET /templates/:id (single)
 * - GET /templates/most-used (most used)
 * - POST /templates (create)
 * - PUT /templates/:id (update)
 * - DELETE /templates/:id (delete)
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
  createTestTemplate,
  cleanupTQSchema,
} = require('../../test-data-helper');

describe('TQ Templates API', () => {
  let testTenant;
  let testUser;
  let testToken;
  let tqApp;
  let createdTemplateId;

  beforeAll(async () => {
    // Get TQ app reference
    tqApp = require('@server/tq-api');

    // Create test tenant
    testTenant = await createTestTenant({
      name: 'TQ Templates Test Clinic',
      subdomain: 'tq_templates_' + Date.now(),
    });

    // Create TQ schema for tenant
    await createTQSchema(testTenant.schema_name);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'tq_templates_test_' + Date.now() + '@test.com',
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

  describe('POST /api/tq/v1/templates', () => {
    it('should create a new template', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/templates')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Clinical Report Template',
          content: '<p>Patient: [patient_name]</p><p>Date: $current_date$</p>',
          description: 'Standard clinical report template',
        });

      expect(res.status).toBe(201);
      expect(res.body.meta.code).toBe('TEMPLATE_CREATED');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Clinical Report Template');
      expect(res.body.data.active).toBe(true);
      expect(res.body.data.usageCount).toBe(0);

      createdTemplateId = res.body.data.id;
    });

    it('should fail without title', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/templates')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: '<p>Template without title</p>',
        });

      expect(res.status).toBe(400);
    });

    it('should fail without content', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/templates')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Template without content',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tq/v1/templates', () => {
    beforeAll(async () => {
      // Create additional templates
      await createTestTemplate(testTenant.schema_name, {
        title: 'Search Template 1',
        content: '<p>Content 1</p>',
      });
      await createTestTemplate(testTenant.schema_name, {
        title: 'Search Template 2',
        content: '<p>Content 2</p>',
      });
    });

    it('should list all templates', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/templates')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should search by title', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/templates')
        .query({ search: 'Search Template' })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((template) => {
        expect(template.title).toContain('Search Template');
      });
    });

    it('should filter by active status', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/templates')
        .query({ active: 'true' })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((template) => {
        expect(template.active).toBe(true);
      });
    });

    it('should support pagination', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/templates')
        .query({ limit: 1, offset: 0 })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/tq/v1/templates/most-used', () => {
    beforeAll(async () => {
      // Create templates with different usage counts
      await global.testDb.query(`SET LOCAL search_path TO "${testTenant.schema_name}", public`);
      await global.testDb.query(
        `INSERT INTO template (title, content, usage_count)
         VALUES ('High Usage', '<p>Popular</p>', 50),
                ('Low Usage', '<p>Rarely used</p>', 5)`
      );
    });

    it('should return templates ordered by usage', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/templates/most-used')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Should be ordered by usage_count DESC
      if (res.body.data.length > 1) {
        for (let i = 0; i < res.body.data.length - 1; i++) {
          expect(res.body.data[i].usageCount).toBeGreaterThanOrEqual(
            res.body.data[i + 1].usageCount
          );
        }
      }
    });
  });

  describe('GET /api/tq/v1/templates/:id', () => {
    it('should return a single template', async () => {
      const res = await request(tqApp)
        .get(`/api/tq/v1/templates/${createdTemplateId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', createdTemplateId);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('content');
      expect(res.body.data).toHaveProperty('usageCount');
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .get(`/api/tq/v1/templates/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tq/v1/templates/:id', () => {
    it('should update template title', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/templates/${createdTemplateId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Updated Clinical Report',
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('TEMPLATE_UPDATED');
      expect(res.body.data.title).toBe('Updated Clinical Report');
    });

    it('should update template content', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/templates/${createdTemplateId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: '<p>Updated content with [placeholder]</p>',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe(
        '<p>Updated content with [placeholder]</p>'
      );
    });

    it('should deactivate template', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/templates/${createdTemplateId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          active: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .put(`/api/tq/v1/templates/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Will not update',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tq/v1/templates/:id', () => {
    let templateToDelete;

    beforeEach(async () => {
      templateToDelete = await createTestTemplate(testTenant.schema_name, {
        title: 'Template to Delete',
        content: '<p>Delete me</p>',
      });
    });

    it('should delete template', async () => {
      const res = await request(tqApp)
        .delete(`/api/tq/v1/templates/${templateToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('TEMPLATE_DELETED');

      // Verify template is deleted
      const getRes = await request(tqApp)
        .get(`/api/tq/v1/templates/${templateToDelete.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .delete(`/api/tq/v1/templates/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });
});
