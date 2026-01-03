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
      address, // { line1, line2, city, state, postalCode, country }
      isTrialing = false, // From Stripe subscription.status === 'trialing'
      trialEnd = null // From Stripe subscription.trial_end (ISO string)
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

    // Check if this Stripe customer has already used trial before
    let hasUsedTrialBefore = false;
    if (stripeCustomerId) {
      const trialCheckQuery = `
        SELECT ta.trial_used
        FROM tenant_applications ta
        INNER JOIN tenants t ON ta.tenant_id_fk = t.id
        WHERE t.stripe_customer_id = $1
          AND ta.application_id_fk = $2
          AND ta.trial_used = true
        LIMIT 1
      `;
      const trialCheckResult = await database.query(trialCheckQuery, [stripeCustomerId, tqApp.id]);
      hasUsedTrialBefore = trialCheckResult.rows.length > 0;
    }

    // Get transcription plan
    // If Stripe subscription is trialing AND customer hasn't used trial before, use "trial" plan
    // Otherwise use planSlug (early-access)
    const canUseTrial = isTrialing && !hasUsedTrialBefore;
    const effectivePlanSlug = canUseTrial ? 'trial' : planSlug;
    let transcriptionPlan;
    try {
      transcriptionPlan = await TranscriptionPlan.findBySlug(effectivePlanSlug);
    } catch (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN',
          message: `Transcription plan '${effectivePlanSlug}' not found`
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
      const tenant = await Tenant.create({
        name: tenantName,
        subdomain,
        schemaName,
        timezone,
        status: 'active',
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null
      });

      // 2. Create tenant schema
      await Tenant.createSchema(schemaName);

      // 3. Generate temporary password and hash it
      const temporaryPassword = generateTemporaryPassword();
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);

      // 4. Create admin user
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

      // 5. Calculate license expiration
      // Use Stripe's trial end date if trialing, otherwise check plan's isTrial flag
      let expiresAt = null;
      if (isTrialing && trialEnd) {
        // Use exact trial end from Stripe
        expiresAt = new Date(trialEnd);
      } else if (transcriptionPlan.isTrial) {
        // Fallback to plan's trial days (legacy behavior)
        const days = trialDays || transcriptionPlan.trialDays || 7;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      // 6. Grant TQ license to tenant (this also provisions TQ schema tables)
      const license = await TenantApplication.grantLicense({
        tenantId: tenant.id,
        applicationId: tqApp.id,
        seatsPurchased,
        expiresAt,
        status: 'active',
        trialUsed: canUseTrial // Mark trial as used if this is a trial signup
      });

      // 7. Grant admin user access to TQ
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

      // 8. Configure transcription plan
      await TenantTranscriptionConfig.upsert(tenant.id, {
        planId: transcriptionPlan.id,
        customMonthlyLimit: null,
        transcriptionLanguage: null,
        overageAllowed: false
      });

      // 9. Stripe IDs already stored in tenant record (step 1)

      // 10. Create tenant address if provided
      if (address && address.line1) {
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
      }

      // 11. Create admin contact with phone if provided
      if (adminPhone) {
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
      }

      // Commit transaction
      await client.query('COMMIT');

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
            isTrial: canUseTrial,
            trialEnd: expiresAt ? expiresAt.toISOString() : null
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
 * /provisioning/plan-change:
 *   put:
 *     tags: [Provisioning]
 *     summary: Change tenant subscription plan (upgrade or downgrade)
 *     description: |
 *       **Scope:** External (API Key required)
 *
 *       Updates tenant's transcription plan and seats after Stripe subscription update.
 *       Handles both upgrades and downgrades. Called by N8N after receiving
 *       customer.subscription.updated webhook from Stripe.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeCustomerId, newPlanSlug, newSeatsPurchased]
 *             properties:
 *               stripeCustomerId:
 *                 type: string
 *                 description: Stripe customer ID
 *                 example: "cus_xxxxxxxxxxxxx"
 *               stripeSubscriptionId:
 *                 type: string
 *                 description: Stripe subscription ID
 *                 example: "sub_xxxxxxxxxxxxx"
 *               newPlanSlug:
 *                 type: string
 *                 description: New transcription plan slug
 *                 example: "solo"
 *               newSeatsPurchased:
 *                 type: integer
 *                 description: New total number of seats
 *                 example: 2
 *     responses:
 *       200:
 *         description: Plan changed successfully (includes changeType - upgrade/downgrade)
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tenant or plan not found
 *       500:
 *         description: Plan change failed
 */
router.put('/plan-change', async (req, res) => {
  const client = await database.getClient();

  try {
    const {
      stripeCustomerId,
      stripeSubscriptionId,
      newPlanSlug,
      newSeatsPurchased
    } = req.body;

    // Validate required fields
    if (!stripeCustomerId || !newPlanSlug || newSeatsPurchased === undefined) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'stripeCustomerId, newPlanSlug, and newSeatsPurchased are required'
        }
      });
    }

    // Find tenant by Stripe customer ID
    const tenantQuery = 'SELECT * FROM public.tenants WHERE stripe_customer_id = $1';
    const tenantResult = await database.query(tenantQuery, [stripeCustomerId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'TENANT_NOT_FOUND',
          message: `No tenant found with Stripe customer ID: ${stripeCustomerId}`
        }
      });
    }

    const tenant = tenantResult.rows[0];

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

    // Get current transcription config
    const currentConfig = await TenantTranscriptionConfig.findByTenantId(tenant.id);
    const oldPlan = currentConfig ? {
      slug: currentConfig.planSlug,
      name: currentConfig.planName,
      monthlyMinutesLimit: currentConfig.monthlyMinutesLimit
    } : null;

    // Get current seats
    const currentLicenseQuery = `
      SELECT seats_purchased, seats_used
      FROM public.tenant_applications
      WHERE tenant_id_fk = $1 AND application_id_fk = $2
    `;
    const currentLicenseResult = await database.query(currentLicenseQuery, [tenant.id, tqApp.id]);
    const oldSeats = currentLicenseResult.rows.length > 0 ? currentLicenseResult.rows[0].seats_purchased : 1;

    // Get new transcription plan
    let newPlan;
    try {
      newPlan = await TranscriptionPlan.findBySlug(newPlanSlug);
    } catch (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PLAN',
          message: `Transcription plan '${newPlanSlug}' not found`
        }
      });
    }

    // Get admin user for email
    const adminQuery = `
      SELECT id, email, first_name, last_name
      FROM public.users
      WHERE tenant_id_fk = $1 AND role = 'admin'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    const adminResult = await database.query(adminQuery, [tenant.id]);
    const adminUser = adminResult.rows.length > 0 ? adminResult.rows[0] : null;

    // Start transaction
    await client.query('BEGIN');

    try {
      // 1. Update transcription config with new plan
      // Remove trial expiration if upgrading from trial
      let expiresAt = null;
      if (!newPlan.isTrial && currentConfig?.expiresAt) {
        // Clear expiration when upgrading from trial to paid plan
        const clearExpirationQuery = `
          UPDATE public.tenant_applications
          SET expires_at = NULL
          WHERE tenant_id_fk = $1 AND application_id_fk = $2
        `;
        await client.query(clearExpirationQuery, [tenant.id, tqApp.id]);
      }

      await TenantTranscriptionConfig.upsert(tenant.id, {
        planId: newPlan.id,
        customMonthlyLimit: null,
        overageAllowed: newPlan.allowsOverage || false
      });

      // 2. Update seats purchased
      const updateSeatsQuery = `
        UPDATE public.tenant_applications
        SET seats_purchased = $1, updated_at = NOW()
        WHERE tenant_id_fk = $2 AND application_id_fk = $3
      `;
      await client.query(updateSeatsQuery, [newSeatsPurchased, tenant.id, tqApp.id]);

      // 3. Update Stripe subscription ID if provided
      if (stripeSubscriptionId) {
        const updateStripeQuery = `
          UPDATE public.tenants
          SET stripe_subscription_id = $1, updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(updateStripeQuery, [stripeSubscriptionId, tenant.id]);
      }

      // Commit transaction
      await client.query('COMMIT');

      // Calculate differences
      const seatsDifference = newSeatsPurchased - oldSeats;
      const oldMinutes = oldPlan?.monthlyMinutesLimit || 0;
      const newMinutes = newPlan.monthlyMinutesLimit || 0;

      // Determine change type based on plan minutes (primary) and seats (secondary)
      let changeType;
      if (newMinutes > oldMinutes) {
        changeType = 'upgrade';
      } else if (newMinutes < oldMinutes) {
        changeType = 'downgrade';
      } else if (seatsDifference > 0) {
        changeType = 'upgrade';
      } else if (seatsDifference < 0) {
        changeType = 'downgrade';
      } else {
        changeType = 'lateral'; // Same plan, same seats (shouldn't happen normally)
      }

      // Return success response
      res.status(200).json({
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain
          },
          admin: adminUser ? {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.first_name,
            lastName: adminUser.last_name
          } : null,
          changeType,
          oldPlan: oldPlan ? {
            slug: oldPlan.slug,
            name: oldPlan.name,
            monthlyMinutesLimit: oldMinutes,
            seats: oldSeats
          } : null,
          newPlan: {
            slug: newPlan.slug,
            name: newPlan.name,
            monthlyMinutesLimit: newMinutes,
            seats: newSeatsPurchased
          },
          seatsDifference,
          loginUrl: 'https://hub.livocare.ai/login'
        },
        meta: {
          code: 'PLAN_CHANGED',
          message: `Plan ${changeType} from ${oldPlan?.slug || 'none'} to ${newPlanSlug}`
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'PLAN_CHANGE_FAILED',
        message: error.message || 'Failed to change plan'
      }
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /provisioning/cancel:
 *   put:
 *     tags: [Provisioning]
 *     summary: Cancel tenant subscription
 *     description: |
 *       **Scope:** External (API Key required)
 *
 *       Deactivates tenant account after Stripe subscription cancellation.
 *       Called by N8N after receiving customer.subscription.deleted webhook from Stripe.
 *       Data is preserved for potential reactivation.
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeCustomerId]
 *             properties:
 *               stripeCustomerId:
 *                 type: string
 *                 description: Stripe customer ID
 *                 example: "cus_xxxxxxxxxxxxx"
 *               stripeSubscriptionId:
 *                 type: string
 *                 description: Stripe subscription ID
 *                 example: "sub_xxxxxxxxxxxxx"
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Cancellation failed
 */
router.put('/cancel', async (req, res) => {
  const client = await database.getClient();

  try {
    const {
      stripeCustomerId,
      stripeSubscriptionId
    } = req.body;

    // Validate required fields
    if (!stripeCustomerId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'stripeCustomerId is required'
        }
      });
    }

    // Find tenant by Stripe customer ID
    const tenantQuery = 'SELECT * FROM public.tenants WHERE stripe_customer_id = $1';
    const tenantResult = await database.query(tenantQuery, [stripeCustomerId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'TENANT_NOT_FOUND',
          message: `No tenant found with Stripe customer ID: ${stripeCustomerId}`
        }
      });
    }

    const tenant = tenantResult.rows[0];

    // Get admin user for email notification
    const adminQuery = `
      SELECT id, email, first_name, last_name
      FROM public.users
      WHERE tenant_id_fk = $1 AND role = 'admin'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    const adminResult = await database.query(adminQuery, [tenant.id]);
    const adminUser = adminResult.rows.length > 0 ? adminResult.rows[0] : null;

    // Get current plan info before cancellation
    const currentConfig = await TenantTranscriptionConfig.findByTenantId(tenant.id);

    // Start transaction
    await client.query('BEGIN');

    try {
      const cancelledAt = new Date();

      // 1. Update tenant status to cancelled
      const updateTenantQuery = `
        UPDATE public.tenants
        SET status = 'cancelled', active = false, updated_at = NOW()
        WHERE id = $1
      `;
      await client.query(updateTenantQuery, [tenant.id]);

      // 2. Deactivate all tenant applications (soft delete)
      const deactivateAppsQuery = `
        UPDATE public.tenant_applications
        SET active = false, updated_at = NOW()
        WHERE tenant_id_fk = $1
      `;
      await client.query(deactivateAppsQuery, [tenant.id]);

      // 3. Deactivate all user access (soft delete)
      const deactivateAccessQuery = `
        UPDATE public.user_application_access
        SET active = false
        WHERE tenant_id_fk = $1
      `;
      await client.query(deactivateAccessQuery, [tenant.id]);

      // 4. Disable transcription config
      const disableConfigQuery = `
        UPDATE public.tenant_transcription_config
        SET enabled = false, updated_at = NOW()
        WHERE tenant_id_fk = $1
      `;
      await client.query(disableConfigQuery, [tenant.id]);

      // Commit transaction
      await client.query('COMMIT');

      // Return success response
      res.status(200).json({
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain
          },
          admin: adminUser ? {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.first_name,
            lastName: adminUser.last_name
          } : null,
          cancelledPlan: currentConfig ? {
            slug: currentConfig.planSlug,
            name: currentConfig.planName
          } : null,
          cancelledAt: cancelledAt.toISOString(),
          reactivationUrl: 'https://hub.livocare.ai/plans'
        },
        meta: {
          code: 'SUBSCRIPTION_CANCELLED',
          message: 'Subscription cancelled successfully.'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'CANCELLATION_FAILED',
        message: error.message || 'Failed to cancel subscription'
      }
    });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /provisioning/subscription-status:
 *   put:
 *     tags: [Provisioning]
 *     summary: Update tenant subscription status based on Stripe events
 *     description: |
 *       **Scope:** External (API Key required)
 *
 *       Unified endpoint to handle all subscription status transitions from Stripe.
 *       Handles trial endings, payment failures, and status changes.
 *       Called by N8N after receiving customer.subscription.updated webhook from Stripe.
 *
 *       Status transitions handled:
 *       - trialing → active: Trial ended successfully, activate full access
 *       - trialing → paused: Trial ended without payment method
 *       - trialing → past_due: Trial ended but payment failed
 *       - active → past_due: Monthly payment failed
 *       - active → paused: Subscription paused
 *       - any → canceled: Subscription cancelled (use /cancel endpoint instead)
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stripeCustomerId, subscriptionStatus]
 *             properties:
 *               stripeCustomerId:
 *                 type: string
 *                 description: Stripe customer ID
 *                 example: "cus_xxxxxxxxxxxxx"
 *               stripeSubscriptionId:
 *                 type: string
 *                 description: Stripe subscription ID
 *                 example: "sub_xxxxxxxxxxxxx"
 *               subscriptionStatus:
 *                 type: string
 *                 enum: [active, paused, past_due, canceled, unpaid]
 *                 description: Current subscription status from Stripe
 *               previousStatus:
 *                 type: string
 *                 enum: [trialing, active, paused, past_due]
 *                 description: Previous subscription status (from previous_attributes)
 *     responses:
 *       200:
 *         description: Subscription status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Update failed
 */
router.put('/subscription-status', async (req, res) => {
  const client = await database.getClient();

  try {
    const {
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionStatus,
      previousStatus
    } = req.body;

    // Validate required fields
    if (!stripeCustomerId || !subscriptionStatus) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'stripeCustomerId and subscriptionStatus are required'
        }
      });
    }

    // Find tenant by Stripe customer ID
    const tenantQuery = 'SELECT * FROM public.tenants WHERE stripe_customer_id = $1';
    const tenantResult = await database.query(tenantQuery, [stripeCustomerId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'TENANT_NOT_FOUND',
          message: `No tenant found with Stripe customer ID: ${stripeCustomerId}`
        }
      });
    }

    const tenant = tenantResult.rows[0];

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

    // Get admin user for response
    const adminQuery = `
      SELECT id, email, first_name, last_name
      FROM public.users
      WHERE tenant_id_fk = $1 AND role = 'admin'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    const adminResult = await database.query(adminQuery, [tenant.id]);
    const adminUser = adminResult.rows.length > 0 ? adminResult.rows[0] : null;

    // Get current transcription config
    const currentConfig = await TenantTranscriptionConfig.findByTenantId(tenant.id);

    // Start transaction
    await client.query('BEGIN');

    try {
      let action = 'none';
      let newPlanSlug = null;

      // Handle transitions from trialing
      if (previousStatus === 'trialing') {
        if (subscriptionStatus === 'active') {
          // Trial ended successfully - activate full access
          action = 'trial_to_active';

          // 1. Clear expires_at for permanent access
          const clearExpirationQuery = `
            UPDATE public.tenant_applications
            SET expires_at = NULL, status = 'active', updated_at = NOW()
            WHERE tenant_id_fk = $1 AND application_id_fk = $2
          `;
          await client.query(clearExpirationQuery, [tenant.id, tqApp.id]);

          // 2. Upgrade from trial plan to early-access plan
          const earlyAccessPlan = await TranscriptionPlan.findBySlug('early-access');
          // Check if current plan is trial (by slug or by isTrial flag)
          const isCurrentPlanTrial = currentConfig?.plan?.slug === 'trial' || currentConfig?.plan?.isTrial === true;
          if (earlyAccessPlan && isCurrentPlanTrial) {
            await TenantTranscriptionConfig.upsert(tenant.id, {
              planId: earlyAccessPlan.id,
              customMonthlyLimit: null,
              overageAllowed: earlyAccessPlan.allowsOverage || false
            });
            newPlanSlug = 'early-access';
          }

        } else if (subscriptionStatus === 'paused') {
          // Trial ended without payment method - suspend access
          action = 'trial_to_paused';

          // Update status to suspended (expires_at already blocks access)
          const suspendQuery = `
            UPDATE public.tenant_applications
            SET status = 'suspended', updated_at = NOW()
            WHERE tenant_id_fk = $1 AND application_id_fk = $2
          `;
          await client.query(suspendQuery, [tenant.id, tqApp.id]);

        } else if (subscriptionStatus === 'past_due') {
          // Trial ended but payment failed - mark as past_due
          action = 'trial_to_past_due';

          // Give grace period: extend expires_at by 3 days
          const gracePeriodQuery = `
            UPDATE public.tenant_applications
            SET status = 'past_due',
                expires_at = GREATEST(expires_at, NOW()) + INTERVAL '3 days',
                updated_at = NOW()
            WHERE tenant_id_fk = $1 AND application_id_fk = $2
          `;
          await client.query(gracePeriodQuery, [tenant.id, tqApp.id]);
        }
      }
      // Handle transitions from active
      else if (previousStatus === 'active') {
        if (subscriptionStatus === 'past_due') {
          // Monthly payment failed - mark as past_due with grace period
          action = 'active_to_past_due';

          const pastDueQuery = `
            UPDATE public.tenant_applications
            SET status = 'past_due',
                expires_at = NOW() + INTERVAL '7 days',
                updated_at = NOW()
            WHERE tenant_id_fk = $1 AND application_id_fk = $2
          `;
          await client.query(pastDueQuery, [tenant.id, tqApp.id]);

        } else if (subscriptionStatus === 'paused') {
          // Subscription paused
          action = 'active_to_paused';

          const pauseQuery = `
            UPDATE public.tenant_applications
            SET status = 'suspended', updated_at = NOW()
            WHERE tenant_id_fk = $1 AND application_id_fk = $2
          `;
          await client.query(pauseQuery, [tenant.id, tqApp.id]);
        }
      }
      // Handle recovery from past_due
      else if (previousStatus === 'past_due' && subscriptionStatus === 'active') {
        // Payment recovered - restore access
        action = 'past_due_to_active';

        const restoreQuery = `
          UPDATE public.tenant_applications
          SET status = 'active', expires_at = NULL, updated_at = NOW()
          WHERE tenant_id_fk = $1 AND application_id_fk = $2
        `;
        await client.query(restoreQuery, [tenant.id, tqApp.id]);
      }
      // Handle recovery from paused
      else if (previousStatus === 'paused' && subscriptionStatus === 'active') {
        // Subscription resumed - restore access
        action = 'paused_to_active';

        const resumeQuery = `
          UPDATE public.tenant_applications
          SET status = 'active', expires_at = NULL, updated_at = NOW()
          WHERE tenant_id_fk = $1 AND application_id_fk = $2
        `;
        await client.query(resumeQuery, [tenant.id, tqApp.id]);
      }

      // Update Stripe subscription ID if provided
      if (stripeSubscriptionId) {
        const updateStripeQuery = `
          UPDATE public.tenants
          SET stripe_subscription_id = $1, updated_at = NOW()
          WHERE id = $2
        `;
        await client.query(updateStripeQuery, [stripeSubscriptionId, tenant.id]);
      }

      // Commit transaction
      await client.query('COMMIT');

      // Return success response
      res.status(200).json({
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain
          },
          admin: adminUser ? {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.first_name,
            lastName: adminUser.last_name
          } : null,
          action,
          previousStatus,
          newStatus: subscriptionStatus,
          newPlanSlug,
          loginUrl: 'https://hub.livocare.ai/login'
        },
        meta: {
          code: 'SUBSCRIPTION_STATUS_UPDATED',
          message: `Subscription status updated: ${previousStatus || 'unknown'} → ${subscriptionStatus}`
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: error.message || 'Failed to update subscription status'
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
