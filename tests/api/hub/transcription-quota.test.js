/**
 * HUB TRANSCRIPTION QUOTA API TESTS
 *
 * Tests for transcription usage and configuration endpoints:
 * - GET /configurations/transcription-usage
 * - GET /configurations/transcription-usage/details
 * - PUT /configurations/transcription-config
 */

const request = require('supertest');
const app = require('@server/app');
const { generateTestToken } = require('../../auth-helper');
const {
  createTestTenant,
  createTestUser,
  cleanupTestTenant,
} = require('../../test-data-helper');

describe('Hub Transcription Quota API', () => {
  let testTenant;
  let testUser;
  let adminToken;
  let regularToken;

  beforeAll(async () => {
    // Create test tenant
    testTenant = await createTestTenant({
      name: 'Transcription Test Clinic',
      subdomain: 'transcription_test_' + Date.now(),
    });

    // Create admin user
    testUser = await createTestUser(testTenant.id, {
      email: 'transcription_admin_' + Date.now() + '@test.com',
      firstName: 'Transcription',
      lastName: 'Admin',
      role: 'admin',
    });

    // Generate admin token
    adminToken = generateTestToken({
      userId: testUser.id,
      tenantId: testTenant.id,
      email: testUser.email,
      schema: testTenant.schema_name,
      role: 'admin',
      userType: {
        id: 3,
        slug: 'admin',
        name: 'Admin',
        hierarchyLevel: 100,
      },
    });

    // Generate non-admin token
    regularToken = generateTestToken({
      userId: testUser.id,
      tenantId: testTenant.id,
      email: testUser.email,
      schema: testTenant.schema_name,
      role: 'operations',
      userType: {
        id: 1,
        slug: 'operations',
        name: 'Operations',
        hierarchyLevel: 10,
      },
    });

    // Create transcription config for tenant
    await global.testDb.query(
      `INSERT INTO public.tenant_transcription_config
       (tenant_id_fk, plan_id_fk, custom_monthly_limit, overage_allowed, enabled)
       VALUES ($1,
         (SELECT id FROM public.transcription_plans WHERE slug = 'basic' LIMIT 1),
         NULL, false, true)
       ON CONFLICT (tenant_id_fk) DO NOTHING`,
      [testTenant.id]
    );
  });

  afterAll(async () => {
    // Clean up transcription config
    if (testTenant?.id) {
      await global.testDb.query(
        'DELETE FROM public.tenant_transcription_usage WHERE tenant_id_fk = $1',
        [testTenant.id]
      );
      await global.testDb.query(
        'DELETE FROM public.tenant_transcription_config WHERE tenant_id_fk = $1',
        [testTenant.id]
      );
      await cleanupTestTenant(testTenant.id, testTenant.schema_name);
    }
  });

  describe('GET /internal/api/v1/configurations/transcription-usage', () => {
    it('should return transcription usage for admin user', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('current');
      expect(res.body.data).toHaveProperty('history');
      expect(res.body.data).toHaveProperty('plan');
      expect(res.body.data).toHaveProperty('config');
    });

    it('should return current month usage metrics', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const { current } = res.body.data;
      expect(current).toHaveProperty('month');
      expect(current).toHaveProperty('minutesUsed');
      expect(current).toHaveProperty('limit');
      expect(current).toHaveProperty('remaining');
      expect(current).toHaveProperty('percentUsed');
      expect(current).toHaveProperty('overageAllowed');
    });

    it('should return plan information', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const { plan } = res.body.data;
      expect(plan).toHaveProperty('slug');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('allowsCustomLimits');
      expect(plan).toHaveProperty('allowsOverage');
    });

    it('should return history array', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });

    it('should fail for non-admin user', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const res = await request(app).get(
        '/internal/api/v1/configurations/transcription-usage'
      );

      expect(res.status).toBe(401);
    });
  });

  describe('GET /internal/api/v1/configurations/transcription-usage/details', () => {
    beforeAll(async () => {
      // Add some usage records
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      await global.testDb.query(
        `INSERT INTO public.tenant_transcription_usage
         (tenant_id_fk, month, audio_duration_seconds, minutes_rounded_up, stt_model)
         VALUES ($1, $2, 120, 2, 'nova-3'),
                ($1, $2, 300, 5, 'nova-3')`,
        [testTenant.id, currentMonth]
      );
    });

    it('should return detailed usage records for admin', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage/details')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('offset');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage/details')
        .query({ limit: 1, offset: 0 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(1);
      expect(res.body.meta.offset).toBe(0);
    });

    it('should fail for non-admin user', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage/details')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /internal/api/v1/configurations/transcription-config', () => {
    describe('With Basic Plan (no custom limits)', () => {
      it('should reject custom limit changes', async () => {
        const res = await request(app)
          .put('/internal/api/v1/configurations/transcription-config')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ customMonthlyLimit: 5000 });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('does not allow custom limits');
      });

      it('should reject overage changes if plan does not allow', async () => {
        const res = await request(app)
          .put('/internal/api/v1/configurations/transcription-config')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ overageAllowed: true });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toContain('does not allow overage');
      });
    });

    describe('With VIP Plan', () => {
      let vipTenant;
      let vipUser;
      let vipToken;

      beforeAll(async () => {
        // Create VIP tenant
        vipTenant = await createTestTenant({
          name: 'VIP Test Clinic',
          subdomain: 'vip_test_' + Date.now(),
        });

        vipUser = await createTestUser(vipTenant.id, {
          email: 'vip_admin_' + Date.now() + '@test.com',
          role: 'admin',
        });

        vipToken = generateTestToken({
          userId: vipUser.id,
          tenantId: vipTenant.id,
          email: vipUser.email,
          schema: vipTenant.schema_name,
          role: 'admin',
          userType: {
            id: 3,
            slug: 'admin',
            name: 'Admin',
            hierarchyLevel: 100,
          },
        });

        // Create VIP config
        await global.testDb.query(
          `INSERT INTO public.tenant_transcription_config
           (tenant_id_fk, plan_id_fk, custom_monthly_limit, overage_allowed, enabled)
           VALUES ($1,
             (SELECT id FROM public.transcription_plans WHERE slug = 'vip' LIMIT 1),
             3000, false, true)
           ON CONFLICT (tenant_id_fk) DO UPDATE SET
             plan_id_fk = EXCLUDED.plan_id_fk`,
          [vipTenant.id]
        );
      });

      afterAll(async () => {
        if (vipTenant?.id) {
          await global.testDb.query(
            'DELETE FROM public.tenant_transcription_config WHERE tenant_id_fk = $1',
            [vipTenant.id]
          );
          await cleanupTestTenant(vipTenant.id, vipTenant.schema_name);
        }
      });

      it('should allow VIP user to update custom limit', async () => {
        const res = await request(app)
          .put('/internal/api/v1/configurations/transcription-config')
          .set('Authorization', `Bearer ${vipToken}`)
          .send({ customMonthlyLimit: 5000 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.meta.code).toBe('TENANT_TRANSCRIPTION_CONFIG_UPDATED');
      });

      it('should allow VIP user to enable overage', async () => {
        const res = await request(app)
          .put('/internal/api/v1/configurations/transcription-config')
          .set('Authorization', `Bearer ${vipToken}`)
          .send({ overageAllowed: true });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      it('should reject custom limit below plan minimum', async () => {
        const res = await request(app)
          .put('/internal/api/v1/configurations/transcription-config')
          .set('Authorization', `Bearer ${vipToken}`)
          .send({ customMonthlyLimit: 1000 }); // Below 2400 minimum

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('CUSTOM_LIMIT_BELOW_PLAN_MINIMUM');
      });

      it('should validate language to pt-BR or en-US', async () => {
        const res = await request(app)
          .put('/internal/api/v1/configurations/transcription-config')
          .set('Authorization', `Bearer ${vipToken}`)
          .send({ transcriptionLanguage: 'invalid-lang' });

        expect(res.status).toBe(400);
        expect(res.body.error.message).toContain('pt-BR');
      });
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put('/internal/api/v1/configurations/transcription-config')
        .send({ customMonthlyLimit: 5000 });

      expect(res.status).toBe(401);
    });

    it('should fail for non-admin user', async () => {
      const res = await request(app)
        .put('/internal/api/v1/configurations/transcription-config')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ customMonthlyLimit: 5000 });

      expect(res.status).toBe(403);
    });

    it('should fail without any update fields', async () => {
      const res = await request(app)
        .put('/internal/api/v1/configurations/transcription-config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('At least one field');
    });
  });

  describe('Tenant Without Transcription Config', () => {
    let noConfigTenant;
    let noConfigUser;
    let noConfigToken;

    beforeAll(async () => {
      noConfigTenant = await createTestTenant({
        name: 'No Config Clinic',
        subdomain: 'no_config_' + Date.now(),
      });

      noConfigUser = await createTestUser(noConfigTenant.id, {
        email: 'no_config_' + Date.now() + '@test.com',
        role: 'admin',
      });

      noConfigToken = generateTestToken({
        userId: noConfigUser.id,
        tenantId: noConfigTenant.id,
        email: noConfigUser.email,
        schema: noConfigTenant.schema_name,
        role: 'admin',
        userType: {
          id: 3,
          slug: 'admin',
          name: 'Admin',
          hierarchyLevel: 100,
        },
      });
    });

    afterAll(async () => {
      if (noConfigTenant?.id) {
        await cleanupTestTenant(noConfigTenant.id, noConfigTenant.schema_name);
      }
    });

    it('should return 403 when transcription not configured', async () => {
      const res = await request(app)
        .get('/internal/api/v1/configurations/transcription-usage')
        .set('Authorization', `Bearer ${noConfigToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('not configured');
    });
  });
});
