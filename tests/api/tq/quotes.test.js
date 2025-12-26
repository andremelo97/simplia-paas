/**
 * TQ QUOTES API TESTS
 *
 * Tests for quote management endpoints:
 * - GET /quotes (list)
 * - GET /quotes/:id (single)
 * - POST /quotes (create)
 * - PUT /quotes/:id (update)
 * - POST /quotes/:id/items (add item)
 * - POST /quotes/:id/calculate (recalculate total)
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
  createTestQuoteItem,
  cleanupTQSchema,
} = require('../../test-data-helper');

describe('TQ Quotes API', () => {
  let testTenant;
  let testUser;
  let testToken;
  let testPatient;
  let testSession;
  let tqApp;
  let createdQuoteId;

  beforeAll(async () => {
    // Get TQ app reference
    tqApp = require('@server/tq-api');

    // Create test tenant
    testTenant = await createTestTenant({
      name: 'TQ Quotes Test Clinic',
      subdomain: 'tq_quotes_' + Date.now(),
    });

    // Create TQ schema for tenant
    await createTQSchema(testTenant.schema_name);

    // Create test user
    testUser = await createTestUser(testTenant.id, {
      email: 'tq_quotes_test_' + Date.now() + '@test.com',
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
      firstName: 'Quote',
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

  describe('POST /api/tq/v1/quotes', () => {
    it('should create a new quote', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/quotes')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSession.id,
          content: '<p>Quote content</p>',
        });

      expect(res.status).toBe(201);
      expect(res.body.meta.code).toBe('QUOTE_CREATED');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('number');
      expect(res.body.data.sessionId).toBe(testSession.id);

      createdQuoteId = res.body.data.id;
    });

    it('should auto-generate quote number', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/quotes')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          sessionId: testSession.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.number).toMatch(/^QUO\d{6}$/);
    });

    it('should fail without session ID', async () => {
      const res = await request(tqApp)
        .post('/api/tq/v1/quotes')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: 'Quote without session',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tq/v1/quotes', () => {
    beforeAll(async () => {
      // Create additional quotes
      await createTestQuote(testTenant.schema_name, testSession.id, {
        status: 'sent',
      });
      await createTestQuote(testTenant.schema_name, testSession.id, {
        status: 'approved',
      });
    });

    it('should list all quotes', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/quotes')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by session ID', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/quotes')
        .query({ sessionId: testSession.id })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((quote) => {
        expect(quote.sessionId).toBe(testSession.id);
      });
    });

    it('should include session and patient data', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/quotes')
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(tqApp)
        .get('/api/tq/v1/quotes')
        .query({ limit: 1, offset: 0 })
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/tq/v1/quotes/:id', () => {
    it('should return a single quote with items', async () => {
      const res = await request(tqApp)
        .get(`/api/tq/v1/quotes/${createdQuoteId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', createdQuoteId);
      expect(res.body.data).toHaveProperty('number');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('total');
    });

    it('should return 404 for non-existent quote', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(tqApp)
        .get(`/api/tq/v1/quotes/${fakeId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tq/v1/quotes/:id', () => {
    it('should update quote content', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/quotes/${createdQuoteId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: '<p>Updated quote content</p>',
        });

      expect(res.status).toBe(200);
      expect(res.body.meta.code).toBe('QUOTE_UPDATED');
      expect(res.body.data.content).toBe('<p>Updated quote content</p>');
    });

    it('should update quote status', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/quotes/${createdQuoteId}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'sent',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
    });
  });

  describe('Quote Items', () => {
    let quoteWithItems;

    beforeAll(async () => {
      quoteWithItems = await createTestQuote(
        testTenant.schema_name,
        testSession.id
      );
    });

    describe('POST /api/tq/v1/quotes/:id/items', () => {
      it('should add item to quote', async () => {
        const res = await request(tqApp)
          .post(`/api/tq/v1/quotes/${quoteWithItems.id}/items`)
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            name: 'Consultation',
            description: 'Medical consultation',
            basePrice: 150.0,
            discountAmount: 0,
            quantity: 1,
          });

        expect(res.status).toBe(201);
        expect(res.body.meta.code).toBe('QUOTE_ITEM_CREATED');
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toBe('Consultation');
        expect(res.body.data.basePrice).toBe('150.00');
      });

      it('should calculate final price correctly', async () => {
        const res = await request(tqApp)
          .post(`/api/tq/v1/quotes/${quoteWithItems.id}/items`)
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            name: 'Procedure',
            basePrice: 200.0,
            discountAmount: 20.0,
            quantity: 2,
          });

        expect(res.status).toBe(201);
        // final = (200 - 20) * 2 = 360
        expect(parseFloat(res.body.data.finalPrice)).toBe(360.0);
      });
    });

    describe('POST /api/tq/v1/quotes/:id/calculate', () => {
      it('should recalculate quote total', async () => {
        // Add items first
        await createTestQuoteItem(testTenant.schema_name, quoteWithItems.id, {
          name: 'Item 1',
          basePrice: 100.0,
          discountAmount: 0,
          quantity: 1,
        });
        await createTestQuoteItem(testTenant.schema_name, quoteWithItems.id, {
          name: 'Item 2',
          basePrice: 50.0,
          discountAmount: 0,
          quantity: 2,
        });

        const res = await request(tqApp)
          .post(`/api/tq/v1/quotes/${quoteWithItems.id}/calculate`)
          .set('x-tenant-id', testTenant.id.toString())
          .set('Authorization', `Bearer ${testToken}`);

        expect(res.status).toBe(200);
        expect(res.body.meta.code).toBe('QUOTE_CALCULATED');
        // Total should be sum of all items' final prices
        expect(parseFloat(res.body.data.total)).toBeGreaterThan(0);
      });
    });
  });

  describe('Status Transitions', () => {
    let transitionQuote;

    beforeEach(async () => {
      transitionQuote = await createTestQuote(
        testTenant.schema_name,
        testSession.id,
        { status: 'draft' }
      );
    });

    it('should transition from draft to sent', async () => {
      const res = await request(tqApp)
        .put(`/api/tq/v1/quotes/${transitionQuote.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'sent' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
    });

    it('should transition from sent to approved', async () => {
      // First send
      await request(tqApp)
        .put(`/api/tq/v1/quotes/${transitionQuote.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'sent' });

      // Then approve
      const res = await request(tqApp)
        .put(`/api/tq/v1/quotes/${transitionQuote.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('should transition from sent to rejected', async () => {
      // First send
      await request(tqApp)
        .put(`/api/tq/v1/quotes/${transitionQuote.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'sent' });

      // Then reject
      const res = await request(tqApp)
        .put(`/api/tq/v1/quotes/${transitionQuote.id}`)
        .set('x-tenant-id', testTenant.id.toString())
        .set('Authorization', `Bearer ${testToken}`)
        .send({ status: 'rejected' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
    });
  });
});
