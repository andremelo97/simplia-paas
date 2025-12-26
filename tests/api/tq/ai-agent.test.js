/**
 * TQ AI AGENT API TESTS
 *
 * Tests for AI agent endpoints with OpenAI mocking:
 * - POST /ai-agent/chat (chat with AI)
 * - POST /ai-agent/fill-template (fill template with AI)
 * - GET /configurations/ai-agent (get config)
 * - PUT /configurations/ai-agent (update config)
 * - POST /configurations/ai-agent/reset (reset to default)
 */

const request = require('supertest');
const { generateTestToken } = require('../../auth-helper');
const {
  setupOpenAIMock,
  queueMockResponse,
  queueMockError,
  restoreOpenAIMock,
  mockTemplateFilledResponse,
} = require('../../mocks/openai.mock');
const {
  createTestTenant,
  createTestUser,
  createTestLicense,
  createTestUserAccess,
  cleanupTestTenant,
  createTQSchema,
  createTestPatient,
  createTestSession,
  createTestTemplate,
  cleanupTQSchema,
} = require('../../test-data-helper');

describe('TQ AI Agent API', () => {
  let testTenant;
  let testUser;
  let testToken;
  let testPatient;
  let testSession;
  let testTemplate;
  let tqApp;
  let originalFetch;

  beforeAll(async () => {
    // Get TQ app reference
    tqApp = require('@server/tq-api');

    // Create test tenant
    testTenant = await createTestTenant({
      name: 'TQ AI Agent Test Clinic',
      subdomain: 'tq_ai_agent_' + Date.now(),
    });

    // Create TQ schema for tenant
    await createTQSchema(testTenant.schema_name);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'tq_ai_agent_test_' + Date.now() + '@test.com',
      firstName: 'AI',
      lastName: 'Tester',
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
      firstName: 'John',
      lastName: 'Patient',
    });

    // Create test session with transcription
    testSession = await createTestSession(
      testTenant.schema_name,
      testPatient.id,
      { notes: 'Test session notes' }
    );

    // Create test template
    testTemplate = await createTestTemplate(testTenant.schema_name, {
      title: 'AI Template',
      content: '<p>Patient: [patient_name]</p><p>Date: $current_date$</p>',
    });

    // Generate token with TQ access
    testToken = generateTestToken({
      userId: testUser.id,
      tenantId: testTenant.id,
      email: testUser.email,
      schema: testTenant.schema_name,
      role: 'admin',
      allowedApps: ['tq'],
      name: 'AI Tester',
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

  describe('POST /api/tq/v1/ai-agent/chat', () => {
    beforeEach(() => {
      const mock = setupOpenAIMock();
      originalFetch = mock.originalFetch;
    });

    afterEach(() => {
      restoreOpenAIMock(originalFetch);
    });

    it('should return AI response for chat message', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/chat')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          messages: [
            { role: 'user', content: 'Create a summary of the consultation' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('response');
      expect(typeof res.body.data.response).toBe('string');
    });

    it('should accept sessionId for context', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/chat')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          messages: [],
          sessionId: testSession.id,
          patientId: testPatient.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('response');
      expect(res.body.data).toHaveProperty('systemMessageUsed');
    });

    it('should fail without authentication', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/chat')
        .set('x-tenant-id', testTenant.id.toString())
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/tq/v1/ai-agent/fill-template', () => {
    beforeEach(() => {
      const mock = setupOpenAIMock({
        customResponse: mockTemplateFilledResponse,
      });
      originalFetch = mock.originalFetch;
    });

    afterEach(() => {
      restoreOpenAIMock(originalFetch);
    });

    it('should fill template with AI', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/fill-template')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          templateId: testTemplate.id,
          sessionId: testSession.id,
          patientId: testPatient.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('TEMPLATE_FILLED');
      expect(res.body.data).toHaveProperty('filledContent');
      expect(typeof res.body.data.filledContent).toBe('string');
    });

    it('should fail without template ID', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/fill-template')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSession.id,
          patientId: testPatient.id,
        });

      expect(res.status).toBe(400);
    });

    it('should fail without session ID', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/fill-template')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          templateId: testTemplate.id,
          patientId: testPatient.id,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('AI Agent Configuration', () => {
    describe('GET /api/tq/v1/configurations/ai-agent', () => {
      it('should return AI agent configuration', async () => {
        const res = await request(tqApp)
          .get('/api/tq/v1/configurations/ai-agent')
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('systemMessage');
        expect(typeof res.body.data.systemMessage).toBe('string');
      });
    });

    describe('PUT /api/tq/v1/configurations/ai-agent', () => {
      it('should update system message', async () => {
        const newSystemMessage = 'Custom AI system message for testing';

        const res = await request(tqApp)
          .put('/api/tq/v1/configurations/ai-agent')
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            systemMessage: newSystemMessage,
          });

        expect(res.status).toBe(200);
        expect(res.body.meta.code).toBe('AI_AGENT_CONFIGURATION_UPDATED');
        expect(res.body.data.systemMessage).toBe(newSystemMessage);
      });

      it('should fail without system message', async () => {
        const res = await request(tqApp)
          .put('/api/tq/v1/configurations/ai-agent')
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`)
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/tq/v1/configurations/ai-agent/reset', () => {
      it('should reset configuration to default', async () => {
        // First update to custom value
        await request(tqApp)
          .put('/api/tq/v1/configurations/ai-agent')
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            systemMessage: 'Custom message to reset',
          });

        // Then reset
        const res = await request(tqApp)
          .post('/api/tq/v1/configurations/ai-agent/reset')
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`);

        expect(res.status).toBe(200);
        expect(res.body.meta.code).toBe('AI_AGENT_CONFIGURATION_RESET');
        expect(res.body.data).toHaveProperty('systemMessage');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      queueMockError(500, 'OpenAI API Error');
    });

    afterEach(() => {
      restoreOpenAIMock(originalFetch);
    });

    it('should handle OpenAI errors gracefully', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/chat')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          messages: [{ role: 'user', content: 'Test error handling' }],
        });

      // Should return 500 or handle error gracefully
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Template Variable Resolution', () => {
    beforeEach(() => {
      const mock = setupOpenAIMock({
        customResponse: mockTemplateFilledResponse,
      });
      originalFetch = mock.originalFetch;
    });

    afterEach(() => {
      restoreOpenAIMock(originalFetch);
    });

    it('should resolve $patient$ variables', async () => {
      const templateWithVars = await createTestTemplate(
        testTenant.schema_name,
        {
          title: 'Variable Template',
          content:
            '<p>Patient: $patient.fullName$</p><p>Provider: $me.fullName$</p>',
        }
      );

      const res = await request(tqApp)
        .post('/api/tq/v1/ai-agent/fill-template')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          templateId: templateWithVars.id,
          sessionId: testSession.id,
          patientId: testPatient.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('filledContent');
    });
  });
});
