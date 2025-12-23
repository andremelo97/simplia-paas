const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const {
  TenantTranscriptionConfig,
  TenantTranscriptionConfigNotFoundError,
  InvalidCustomLimitError
} = require('../../../infra/models/TenantTranscriptionConfig');
const { Tenant, TenantNotFoundError } = require('../../../infra/models/Tenant');
const { TranscriptionPlan, TranscriptionPlanNotFoundError } = require('../../../infra/models/TranscriptionPlan');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const { Application } = require('../../../infra/models/Application');

const router = express.Router();

// All routes require authentication and internal admin platform role
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /tenants/{tenantId}/transcription-config:
 *   get:
 *     tags: [Transcription Configuration]
 *     summary: Get tenant transcription configuration
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get the current transcription quota configuration for a tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 */
router.get('/:tenantId/transcription-config', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Verify tenant exists
    try {
      await Tenant.findById(parseInt(tenantId));
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Tenant not found'
          }
        });
      }
      throw error;
    }

    // Get configuration
    const config = await TenantTranscriptionConfig.findByTenantId(parseInt(tenantId));

    res.json({
      success: true,
      data: config.toJSON()
    });
  } catch (error) {
    if (error instanceof TenantTranscriptionConfigNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Transcription configuration not found for this tenant'
        }
      });
    }

    console.error('[Tenant Transcription Config] Get error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to retrieve transcription configuration'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/transcription-config:
 *   put:
 *     tags: [Transcription Configuration]
 *     summary: Create or update tenant transcription configuration
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Configure transcription quota for a tenant (upsert operation)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId:
 *                 type: integer
 *                 description: ID of the transcription plan (Basic or VIP)
 *               customMonthlyLimit:
 *                 type: integer
 *                 minimum: 2400
 *                 description: Custom monthly limit in minutes (VIP only, must be >= 2400)
 *                 nullable: true
 *               overageAllowed:
 *                 type: boolean
 *                 default: false
 *                 description: Allow usage above monthly limit with extra charges
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: Enable or disable transcription quota enforcement
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid input (custom limit below 2400)
 *       404:
 *         description: Tenant or plan not found
 */
router.put('/:tenantId/transcription-config', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planId, customMonthlyLimit, overageAllowed } = req.body;

    // Validation
    if (!planId) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Missing required field: planId'
        }
      });
    }

    // Verify tenant exists and get timezone for language derivation
    let tenant;
    try {
      tenant = await Tenant.findById(parseInt(tenantId));
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Tenant not found'
          }
        });
      }
      throw error;
    }

    // Verify tenant has TQ app access before allowing transcription config
    const tqApp = await Application.findBySlug('tq');
    const tqLicense = await TenantApplication.findByTenantAndApplication(
      parseInt(tenantId),
      tqApp.id
    );

    if (!tqLicense || tqLicense.status !== 'active') {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Tenant must have active TQ app access before configuring transcription plan'
        }
      });
    }

    // Verify plan exists
    try {
      await TranscriptionPlan.findById(parseInt(planId));
    } catch (error) {
      if (error instanceof TranscriptionPlanNotFoundError) {
        return res.status(404).json({
          error: {
            code: 404,
            message: 'Transcription plan not found'
          }
        });
      }
      throw error;
    }

    // Derive language from tenant timezone (pt-BR for America/Sao_Paulo, en-US for others)
    const defaultLanguage = tenant.timezone === 'America/Sao_Paulo' ? 'pt-BR' : 'en-US';

    // Fetch the plan to check if it's a trial plan
    const plan = await TranscriptionPlan.findById(parseInt(planId));

    // Upsert configuration (reset custom values when only planId is sent)
    const config = await TenantTranscriptionConfig.upsert(parseInt(tenantId), {
      planId: parseInt(planId),
      customMonthlyLimit: customMonthlyLimit ? parseInt(customMonthlyLimit) : null,
      transcriptionLanguage: defaultLanguage, // Set language based on tenant timezone
      overageAllowed: overageAllowed === true  // Explicit boolean conversion (undefined becomes false)
    });

    // If plan is a trial, update TQ app's expires_at in tenant_applications
    if (plan.isTrial && plan.trialDays) {
      try {
        // Find TQ application
        const tqApp = await Application.findBySlug('tq');

        // Find tenant's TQ license
        const tqLicense = await TenantApplication.findByTenantAndApplication(
          parseInt(tenantId),
          tqApp.id
        );

        if (tqLicense) {
          // Calculate expiration date: NOW + trial_days
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + plan.trialDays);

          // Update the license with expiration date
          await tqLicense.update({ expires_at: expiresAt });
          console.log(`✅ [Trial Plan] Updated TQ license expires_at to ${expiresAt.toISOString()} for tenant ${tenantId}`);
        }
      } catch (error) {
        console.warn(`[Trial Plan] Could not update TQ license expires_at:`, error.message);
        // Don't fail the whole request if this fails
      }
    }

    // Fetch full config with plan details
    const fullConfig = await TenantTranscriptionConfig.findByTenantId(parseInt(tenantId));

    res.json({
      success: true,
      data: fullConfig.toJSON(),
      meta: {
        code: 'TENANT_TRANSCRIPTION_CONFIG_UPDATED'
      }
    });
  } catch (error) {
    if (error instanceof InvalidCustomLimitError) {
      return res.status(400).json({
        error: {
          code: 400,
          message: error.message
        }
      });
    }

    console.error('[Tenant Transcription Config] Update error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to update transcription configuration'
      }
    });
  }
});

module.exports = router;
