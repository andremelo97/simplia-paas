const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Tenant } = require('../../../infra/models/Tenant');
const User = require('../../../infra/models/User');
const { UserNotFoundError } = require('../../../../shared/types/user');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const { UserApplicationAccess } = require('../../../infra/models/UserApplicationAccess');
const { TenantTranscriptionConfig } = require('../../../infra/models/TenantTranscriptionConfig');
const { TranscriptionPlan } = require('../../../infra/models/TranscriptionPlan');
const { Application } = require('../../../infra/models/Application');
const { ApiKey } = require('../../../infra/models/ApiKey');
const database = require('../../../infra/db/database');

const router = express.Router();

// API Key validation middleware (validates against database)
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required in x-api-key header'
      }
    });
  }

  try {
    const validKey = await ApiKey.validate(apiKey, 'provisioning');

    if (!validKey) {
      return res.status(403).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key'
        }
      });
    }

    // Attach key info to request for audit purposes
    req.apiKey = validKey;
    next();
  } catch (error) {
    console.error('[Provisioning] API key validation error:', error);
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Failed to validate API key'
      }
    });
  }
};

// Apply API key validation to all routes
router.use(validateApiKey);

/**
 * Generate a secure random password
 */
function generateTemporaryPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

/**
 * Generate subdomain from tenant name
 * Converts "Clínica ABC 123" to "clinica-abc-123"
 */
function generateSubdomain(tenantName) {
  return tenantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dash
    .replace(/^-|-$/g, '')           // Remove leading/trailing dashes
    .substring(0, 63);               // Max 63 chars
}

/**
 * @openapi
 * /provisioning/signup:
 *   post:
 *     tags: [Provisioning]
 *     summary: Provision new tenant with admin user
 *     description: |
 *       **Scope:** External (API Key required)
 *
 *       Creates a new tenant with:
 *       - Tenant record and schema
 *       - Admin user with temporary password
 *       - TQ application license
 *       - User access to TQ
 *       - Transcription plan configuration
 *
 *       This endpoint is called by N8N after Stripe checkout completion.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantName, adminEmail, adminFirstName]
 *             properties:
 *               tenantName:
 *                 type: string
 *                 description: Name of the tenant/clinic
 *                 example: "Clínica ABC"
 *               tenantSubdomain:
 *                 type: string
 *                 description: Optional custom subdomain (auto-generated if not provided)
 *                 example: "clinica-abc"
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 description: Admin user email
 *                 example: "admin@clinica.com"
 *               adminFirstName:
 *                 type: string
 *                 description: Admin user first name
 *                 example: "João"
 *               adminLastName:
 *                 type: string
 *                 description: Admin user last name
 *                 example: "Silva"
 *               timezone:
 *                 type: string
 *                 description: IANA timezone identifier
 *                 default: "America/Sao_Paulo"
 *                 example: "America/Sao_Paulo"
 *               planSlug:
 *                 type: string
 *                 description: Transcription plan slug
 *                 default: "trial"
 *                 example: "starter"
 *               seatsPurchased:
 *                 type: integer
 *                 description: Number of seats purchased
 *                 default: 1
 *                 example: 2
 *               trialDays:
 *                 type: integer
 *                 description: Trial duration in days (overrides plan default)
 *                 example: 7
 *               stripeCustomerId:
 *                 type: string
 *                 description: Stripe customer ID for billing
 *                 example: "cus_xxxxxxxxxxxxx"
 *               stripeSubscriptionId:
 *                 type: string
 *                 description: Stripe subscription ID
 *                 example: "sub_xxxxxxxxxxxxx"
 *               adminPhone:
 *                 type: string
 *                 description: Admin user phone number (E.164 format recommended)
 *                 example: "+5511999999999"
 *               address:
 *                 type: object
 *                 description: Billing address information
 *                 properties:
 *                   line1:
 *                     type: string
 *                     description: Street address line 1
 *                     example: "Rua Example, 123"
 *                   line2:
 *                     type: string
 *                     description: Street address line 2 (apartment, suite, etc.)
 *                     example: "Sala 45"
 *                   city:
 *                     type: string
 *                     description: City name
 *                     example: "São Paulo"
 *                   state:
 *                     type: string
 *                     description: State/province code
 *                     example: "SP"
 *                   postalCode:
 *                     type: string
 *                     description: Postal/ZIP code
 *                     example: "01234-567"
 *                   country:
 *                     type: string
 *                     description: Two-letter country code (ISO 3166-1 alpha-2)
 *                     default: "BR"
 *                     example: "BR"
 *     responses:
 *       201:
 *         description: Tenant provisioned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         name: { type: string }
 *                         subdomain: { type: string }
 *                         timezone: { type: string }
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         email: { type: string }
 *                         temporaryPassword: { type: string }
 *                     license:
 *                       type: object
 *                       properties:
 *                         applicationId: { type: integer }
 *                         applicationSlug: { type: string }
 *                         seatsPurchased: { type: integer }
 *                         expiresAt: { type: string, nullable: true }
 *                     transcription:
 *                       type: object
 *                       properties:
 *                         planSlug: { type: string }
 *                         monthlyMinutesLimit: { type: integer }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "TENANT_PROVISIONED" }
 *       400:
 *         description: Validation error
 *       409:
 *         description: Tenant or user already exists
 *       500:
 *         description: Provisioning failed
 */
router.post('/signup', async (req, res) => {
  const client = await database.getClient();

  try {
    const {
      tenantName,
      tenantSubdomain,
      adminEmail,
      adminFirstName,
      adminLastName = '',
      adminPhone,
      timezone = 'America/Sao_Paulo',
      planSlug = 'trial',
      seatsPurchased = 1,
      trialDays,
      stripeCustomerId,
      stripeSubscriptionId,
      address // { line1, line2, city, state, postalCode, country }
    } = req.body;

    // Validate required fields
    if (!tenantName || !adminEmail || !adminFirstName) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'tenantName, adminEmail, and adminFirstName are required'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    console.log(`🚀 [Provisioning] Starting provisioning for tenant: ${tenantName}`);

    // Generate or validate subdomain
    const subdomain = tenantSubdomain || generateSubdomain(tenantName);
    const schemaName = `tenant_${subdomain.replace(/-/g, '_')}`;

    // Check if subdomain already exists
    const existingTenant = await Tenant.findBySubdomain(subdomain);
    if (existingTenant) {
      return res.status(409).json({
        error: {
          code: 'TENANT_EXISTS',
          message: `Tenant with subdomain '${subdomain}' already exists`
        }
      });
    }

    // Check if email already exists
    try {
      const existingUser = await User.findByEmailGlobal(adminEmail.toLowerCase());
      if (existingUser) {
        // Get tenant info for the response
        let tenantInfo = null;
        try {
          const existingTenant = await Tenant.findById(existingUser.tenantIdFk);
          tenantInfo = {
            id: existingTenant.id,
            name: existingTenant.name,
            subdomain: existingTenant.subdomain
          };
        } catch (e) {
          // Tenant might not exist, continue without it
        }

        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: `User with email '${adminEmail}' already exists`
          },
          data: {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName
            },
            tenant: tenantInfo,
            loginUrl: 'https://hub.livocare.ai/login'
          }
        });
      }
    } catch (error) {
      // UserNotFoundError is expected - continue
      if (!(error instanceof UserNotFoundError) && error.name !== 'UserNotFoundError') {
        throw error;
      }
    }

    // Get TQ application
    const tqApp = await Application.findBySlug('tq');
    if (!tqApp) {
      return res.status(500).json({
        error: {
          code: 'TQ_APP_NOT_FOUND',
          message: 'TQ application not found in database'
        }
      });
    }

    // Get transcription plan
    let transcriptionPlan;
    try {
      transcriptionPlan = await TranscriptionPlan.findBySlug(planSlug);
    } catch (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN',
          message: `Transcription plan '${planSlug}' not found`
        }
      });
    }

    // Get user type for admin (id = 2 for admin type)
    const userTypeQuery = 'SELECT id FROM user_types WHERE slug = $1';
    const userTypeResult = await database.query(userTypeQuery, ['admin']);
    if (userTypeResult.rows.length === 0) {
      return res.status(500).json({
        error: {
          code: 'USER_TYPE_NOT_FOUND',
          message: 'Admin user type not found'
        }
      });
    }
    const adminUserTypeId = userTypeResult.rows[0].id;

    // Start transaction
    await client.query('BEGIN');

    try {
      // 1. Create tenant
      console.log(`📁 [Provisioning] Creating tenant: ${tenantName} (${subdomain})`);
      const tenant = await Tenant.create({
        name: tenantName,
        subdomain,
        schemaName,
        timezone,
        status: 'active',
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null
      });
      console.log(`✅ [Provisioning] Tenant created with ID: ${tenant.id}`);

      // 2. Create tenant schema
      console.log(`📁 [Provisioning] Creating schema: ${schemaName}`);
      await Tenant.createSchema(schemaName);
      console.log(`✅ [Provisioning] Schema created`);

      // 3. Generate temporary password and hash it
      const temporaryPassword = generateTemporaryPassword();
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);

      // 4. Create admin user
      console.log(`👤 [Provisioning] Creating admin user: ${adminEmail}`);
      const adminUser = await User.create({
        tenantIdFk: tenant.id,
        email: adminEmail.toLowerCase(),
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'admin',
        status: 'active',
        userTypeId: adminUserTypeId
      });
      console.log(`✅ [Provisioning] Admin user created with ID: ${adminUser.id}`);

      // 5. Calculate license expiration
      let expiresAt = null;
      if (transcriptionPlan.isTrial) {
        const days = trialDays || transcriptionPlan.trialDays || 7;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      // 6. Grant TQ license to tenant (this also provisions TQ schema tables)
      console.log(`📜 [Provisioning] Granting TQ license to tenant`);
      const license = await TenantApplication.grantLicense({
        tenantId: tenant.id,
        applicationId: tqApp.id,
        seatsPurchased,
        expiresAt,
        status: 'active'
      });
      console.log(`✅ [Provisioning] TQ license granted`);

      // 7. Grant admin user access to TQ
      console.log(`🔑 [Provisioning] Granting admin access to TQ`);

      // Insert directly to avoid pricing validation (provisioning is special)
      const accessQuery = `
        INSERT INTO user_application_access (
          tenant_id_fk, user_id_fk, application_id_fk, user_type_id_snapshot_fk,
          role_in_app, active, granted_at
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW())
        RETURNING id
      `;
      await client.query(accessQuery, [
        tenant.id,
        adminUser.id,
        tqApp.id,
        adminUserTypeId,
        'admin'
      ]);

      // Increment seat count
      await TenantApplication.incrementSeat(tenant.id, tqApp.id);
      console.log(`✅ [Provisioning] Admin access granted`);

      // 8. Configure transcription plan
      console.log(`📊 [Provisioning] Configuring transcription plan: ${planSlug}`);
      await TenantTranscriptionConfig.upsert(tenant.id, {
        planId: transcriptionPlan.id,
        customMonthlyLimit: null,
        transcriptionLanguage: null,
        overageAllowed: false
      });
      console.log(`✅ [Provisioning] Transcription plan configured`);

      // 9. Stripe IDs already stored in tenant record (step 1)

      // 10. Create tenant address if provided
      if (address && address.line1) {
        console.log(`📍 [Provisioning] Creating tenant address`);
        const addressQuery = `
          INSERT INTO public.tenant_addresses (
            tenant_id_fk, type, line1, line2, city, state, postal_code, country_code, is_primary
          )
          VALUES ($1, 'BILLING', $2, $3, $4, $5, $6, $7, true)
        `;
        await client.query(addressQuery, [
          tenant.id,
          address.line1,
          address.line2 || null,
          address.city || null,
          address.state || null,
          address.postalCode || null,
          (address.country || 'BR').toUpperCase().substring(0, 2)
        ]);
        console.log(`✅ [Provisioning] Tenant address created`);
      }

      // 11. Create admin contact with phone if provided
      if (adminPhone) {
        console.log(`📞 [Provisioning] Creating admin contact`);
        const contactQuery = `
          INSERT INTO public.tenant_contacts (
            tenant_id_fk, type, full_name, email, phone, is_primary
          )
          VALUES ($1, 'ADMIN', $2, $3, $4, true)
        `;
        await client.query(contactQuery, [
          tenant.id,
          `${adminFirstName} ${adminLastName}`.trim(),
          adminEmail.toLowerCase(),
          adminPhone
        ]);
        console.log(`✅ [Provisioning] Admin contact created`);
      }

      // Commit transaction
      await client.query('COMMIT');

      console.log(`🎉 [Provisioning] Tenant provisioned successfully!`);

      // Return success response
      res.status(201).json({
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            timezone: tenant.timezone,
            stripeCustomerId: tenant.stripeCustomerId,
            stripeSubscriptionId: tenant.stripeSubscriptionId
          },
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            temporaryPassword
          },
          license: {
            applicationId: tqApp.id,
            applicationSlug: tqApp.slug,
            seatsPurchased,
            expiresAt
          },
          transcription: {
            planSlug: transcriptionPlan.slug,
            planName: transcriptionPlan.name,
            monthlyMinutesLimit: transcriptionPlan.monthlyMinutesLimit,
            isTrial: transcriptionPlan.isTrial
          },
          hubUrl: `https://hub.livocare.ai`,
          loginUrl: `https://hub.livocare.ai/login`
        },
        meta: {
          code: 'TENANT_PROVISIONED',
          message: 'Tenant provisioned successfully'
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ [Provisioning] Error:', error);

    // Handle specific error types
    if (error.name === 'DuplicateUserError') {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'PROVISIONING_FAILED',
        message: error.message || 'Failed to provision tenant'
      }
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /provisioning/health:
 *   get:
 *     tags: [Provisioning]
 *     summary: Health check for provisioning endpoint
 *     description: Verify the provisioning API is operational
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Provisioning API is operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
