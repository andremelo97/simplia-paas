const express = require('express');
const { requireAuth, requireAdmin } = require('../../../infra/middleware/auth');
const {
  TenantTranscriptionConfig,
  TenantTranscriptionConfigNotFoundError,
  InvalidCustomLimitError
} = require('../../../infra/models/TenantTranscriptionConfig');
const { TenantTranscriptionUsage } = require('../../../infra/models/TenantTranscriptionUsage');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @openapi
 * /configurations/transcription-usage:
 *   get:
 *     tags: [Configurations]
 *     summary: Get transcription usage
 *     description: |
 *       **Scope:** Platform (User-scoped)
 *
 *       Get transcription usage for the authenticated user's tenant.
 *       Shows current month usage, limit, and remaining minutes.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     config:
 *                       type: object
 *                       description: Tenant transcription configuration
 *                     currentMonth:
 *                       type: object
 *                       properties:
 *                         transcriptionCount:
 *                           type: integer
 *                         totalMinutes:
 *                           type: integer
 *                         totalCostUsd:
 *                           type: number
 *                     limit:
 *                       type: integer
 *                       description: Effective monthly limit in minutes
 *                     remaining:
 *                       type: integer
 *                       description: Remaining minutes in current month
 *                     history:
 *                       type: array
 *                       description: Last 6 months usage history
 *       403:
 *         description: Transcription not configured for tenant
 */
router.get('/transcription-usage', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Authentication required'
        }
      });
    }

    // Get tenant configuration
    let config;
    try {
      config = await TenantTranscriptionConfig.findByTenantId(tenantId);
    } catch (error) {
      if (error instanceof TenantTranscriptionConfigNotFoundError) {
        return res.status(403).json({
          error: {
            code: 403,
            message: 'Transcription service not configured for your account'
          }
        });
      }
      throw error;
    }

    // Get current month usage
    const currentUsage = await TenantTranscriptionUsage.getCurrentMonthUsage(tenantId);

    // Get usage history (last 6 months)
    const history = await TenantTranscriptionUsage.getUsageHistory(tenantId, 6);

    // Calculate effective limit and remaining
    const effectiveLimit = config.getEffectiveMonthlyLimit();
    const minutesUsed = currentUsage.totalMinutes || 0;
    const totalCost = currentUsage.totalCost || 0;
    const totalTranscriptions = currentUsage.totalTranscriptions || 0;
    const remaining = Math.max(0, effectiveLimit - minutesUsed);
    const overage = Math.max(0, minutesUsed - effectiveLimit);
    // Use same precision as frontend (1 decimal place) to avoid inconsistency
    const percentUsed = effectiveLimit > 0 ? parseFloat(((minutesUsed / effectiveLimit) * 100).toFixed(1)) : 0;

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    res.json({
      success: true,
      data: {
        current: {
          month: currentMonth,
          minutesUsed: minutesUsed,
          totalCost: totalCost,
          totalTranscriptions: totalTranscriptions,
          limit: effectiveLimit,
          remaining: remaining,
          overage: overage,
          overageAllowed: config.overageAllowed || false,
          percentUsed: percentUsed
        },
        history: history.map(h => ({
          month: h.month, // Already in YYYY-MM format from model
          minutesUsed: h.minutesUsed,
          totalCost: h.totalCost || 0,
          totalTranscriptions: h.totalTranscriptions || 0,
          limit: effectiveLimit,
          overage: Math.max(0, h.minutesUsed - effectiveLimit)
        })),
        plan: {
          slug: config.plan?.slug || 'unknown',
          name: config.plan?.name || 'Unknown Plan',
          allowsCustomLimits: config.plan?.allowsCustomLimits || false,
          allowsOverage: config.plan?.allowsOverage || false
        },
        config: {
          customMonthlyLimit: config.customMonthlyLimit,
          transcriptionLanguage: config.transcriptionLanguage,
          overageAllowed: config.overageAllowed || false
        }
      }
    });
  } catch (error) {
    console.error('[Hub] Get transcription usage error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to retrieve transcription usage'
      }
    });
  }
});

/**
 * @openapi
 * /configurations/transcription-usage/details:
 *   get:
 *     tags: [Configurations]
 *     summary: Get detailed transcription usage (granular)
 *     description: |
 *       **Scope:** Platform (User-scoped)
 *
 *       Get detailed transcription usage records for the authenticated user's tenant.
 *       Returns granular data per transcription with pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       transcriptionId:
 *                         type: string
 *                       audioDurationSeconds:
 *                         type: integer
 *                       audioDurationMinutes:
 *                         type: number
 *                       sttModel:
 *                         type: string
 *                       costUsd:
 *                         type: number
 *                       usageDate:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       403:
 *         description: Transcription not configured for tenant
 */
router.get('/transcription-usage/details', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!tenantId) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Authentication required'
        }
      });
    }

    // Verify transcription is configured
    try {
      await TenantTranscriptionConfig.findByTenantId(tenantId);
    } catch (error) {
      if (error instanceof TenantTranscriptionConfigNotFoundError) {
        return res.status(403).json({
          error: {
            code: 403,
            message: 'Transcription service not configured for your account'
          }
        });
      }
      throw error;
    }

    // Get detailed usage records with pagination
    const records = await TenantTranscriptionUsage.getAllUsage(tenantId, { limit, offset });

    // Get total count for pagination (all records, not just current month)
    const total = await TenantTranscriptionUsage.getTotalCount(tenantId);

    res.json({
      success: true,
      data: records.map(r => r.toJSON()),
      meta: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[Hub] Get transcription usage details error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to retrieve transcription usage details'
      }
    });
  }
});

/**
 * @openapi
 * /configurations/transcription-config:
 *   put:
 *     tags: [Configurations]
 *     summary: Update transcription configuration (VIP only)
 *     description: |
 *       **Scope:** Platform (User-scoped)
 *
 *       Allows VIP users to customize their monthly transcription limit.
 *       Limit must be >= plan's monthly_minutes_limit.
 *       Basic plan users cannot customize limits.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customMonthlyLimit]
 *             properties:
 *               customMonthlyLimit:
 *                 type: integer
 *                 description: Custom monthly limit in minutes (must be >= plan's limit)
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid input (limit below plan minimum or plan doesn't allow customization)
 *       403:
 *         description: Transcription not configured or not VIP plan
 */
router.put('/transcription-config', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { customMonthlyLimit, transcriptionLanguage, overageAllowed } = req.body;

    if (!tenantId) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Authentication required'
        }
      });
    }

    // At least one field must be provided
    if (customMonthlyLimit === undefined && transcriptionLanguage === undefined && overageAllowed === undefined) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'At least one field (customMonthlyLimit, transcriptionLanguage, or overageAllowed) must be provided'
        }
      });
    }

    // Get tenant configuration
    let config;
    try {
      config = await TenantTranscriptionConfig.findByTenantId(tenantId);
    } catch (error) {
      if (error instanceof TenantTranscriptionConfigNotFoundError) {
        return res.status(403).json({
          error: {
            code: 403,
            message: 'Transcription service not configured for your account'
          }
        });
      }
      throw error;
    }

    // Check permissions based on what's being updated
    if (customMonthlyLimit !== undefined && !config.canCustomizeLimits()) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Your current plan does not allow custom limits. Please upgrade to VIP plan.'
        }
      });
    }

    if (overageAllowed !== undefined && !config.plan?.allowsOverage) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Your current plan does not allow overage. Please upgrade to a plan that supports overage.'
        }
      });
    }

    // Validate custom limit against plan's monthly_minutes_limit
    if (customMonthlyLimit !== undefined) {
      const planMinLimit = config.plan?.monthlyMinutesLimit || 2400;

      if (parseInt(customMonthlyLimit) < planMinLimit) {
        return res.status(400).json({
          error: {
            code: 'CUSTOM_LIMIT_BELOW_PLAN_MINIMUM',
            message: `Custom limit (${customMonthlyLimit}) cannot be below plan's minimum limit of ${planMinLimit} minutes`
          },
          meta: {
            code: 'CUSTOM_LIMIT_BELOW_PLAN_MINIMUM',
            planMinLimit: planMinLimit,
            providedLimit: customMonthlyLimit
          }
        });
      }
    }

    // Build update object
    const updates = {};
    if (customMonthlyLimit !== undefined) {
      updates.custom_monthly_limit = parseInt(customMonthlyLimit);
    }
    if (transcriptionLanguage !== undefined) {
      // Validate language is pt-BR or en-US
      if (transcriptionLanguage !== 'pt-BR' && transcriptionLanguage !== 'en-US') {
        return res.status(400).json({
          error: {
            code: 400,
            message: 'Transcription language must be either "pt-BR" or "en-US"'
          }
        });
      }
      updates.transcription_language = transcriptionLanguage;
    }
    if (overageAllowed !== undefined) {
      updates.overage_allowed = overageAllowed;
    }

    // Update configuration
    await config.update(updates);

    // Fetch updated config
    const updatedConfig = await TenantTranscriptionConfig.findByTenantId(tenantId);

    res.json({
      success: true,
      data: updatedConfig.toJSON(),
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

    console.error('[Hub] Update transcription config error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to update transcription configuration'
      }
    });
  }
});

module.exports = router;
