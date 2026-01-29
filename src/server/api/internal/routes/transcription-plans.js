const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const {
  TranscriptionPlan,
  TranscriptionPlanNotFoundError,
  DuplicateTranscriptionPlanError
} = require('../../../infra/models/TranscriptionPlan');

const router = express.Router();

// All transcription plan routes require authentication and internal admin platform role
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /transcription-plans:
 *   get:
 *     tags: [Transcription Plans]
 *     summary: List transcription quota plans
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get all transcription plans (Basic, VIP, etc.) with filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false/null for all)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/', async (req, res) => {
  try {
    const { active = null, limit = 50, offset = 0 } = req.query;

    const plans = await TranscriptionPlan.findAll({
      active: active !== null ? active === 'true' : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await TranscriptionPlan.count(
      active !== null ? active === 'true' : null
    );

    res.json({
      success: true,
      data: {
        plans: plans.map(p => p.toJSON()),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('[Transcription Plans] List error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to retrieve transcription plans'
      }
    });
  }
});

/**
 * @openapi
 * /transcription-plans/{id}:
 *   get:
 *     tags: [Transcription Plans]
 *     summary: Get transcription plan by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan retrieved successfully
 *       404:
 *         description: Plan not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await TranscriptionPlan.findById(parseInt(id));

    res.json({
      success: true,
      data: plan.toJSON()
    });
  } catch (error) {
    if (error instanceof TranscriptionPlanNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }

    console.error('[Transcription Plans] Get error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to retrieve transcription plan'
      }
    });
  }
});

/**
 * @openapi
 * /transcription-plans:
 *   post:
 *     tags: [Transcription Plans]
 *     summary: Create new transcription plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, name, monthlyMinutesLimit, sttModel, languageDetectionEnabled, costPerMinuteUsd, allowsCustomLimits, allowsOverage, active]
 *             properties:
 *               slug:
 *                 type: string
 *                 example: "vip"
 *               name:
 *                 type: string
 *                 example: "VIP Plan"
 *               monthlyMinutesLimit:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2400
 *                 description: "Monthly limit in minutes"
 *               allowsCustomLimits:
 *                 type: boolean
 *                 example: false
 *                 description: "Whether users can customize monthly limits in Hub"
 *               allowsOverage:
 *                 type: boolean
 *                 example: false
 *                 description: "Whether users can enable overage (usage beyond limits) in Hub"
 *               sttModel:
 *                 type: string
 *                 example: "nova-3"
 *                 description: "Deepgram STT model (always nova-3)"
 *               languageDetectionEnabled:
 *                 type: boolean
 *                 example: false
 *                 description: "If true, uses detect_language=true (multilingual $0.0052/min). If false, uses language parameter (monolingual $0.0043/min)"
 *               costPerMinuteUsd:
 *                 type: number
 *                 example: 0.0043
 *                 description: "Cost per minute: $0.0043 for monolingual, $0.0052 for multilingual"
 *               active:
 *                 type: boolean
 *                 example: true
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Plan slug already exists
 */
router.post('/', async (req, res) => {
  try {
    const {
      slug,
      name,
      monthlyMinutesLimit,
      allowsCustomLimits,
      allowsOverage,
      sttModel,
      languageDetectionEnabled,
      costPerMinuteUsd,
      showCost,
      active,
      description
    } = req.body;

    // Validation
    if (!slug || !name || !monthlyMinutesLimit) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Missing required fields: slug, name, monthlyMinutesLimit'
        }
      });
    }

    const plan = await TranscriptionPlan.create({
      slug,
      name,
      monthlyMinutesLimit: parseInt(monthlyMinutesLimit),
      allowsCustomLimits,
      allowsOverage,
      sttModel,
      languageDetectionEnabled,
      costPerMinuteUsd,
      showCost,
      active,
      description
    });

    res.status(201).json({
      success: true,
      data: plan.toJSON(),
      meta: {
        code: 'TRANSCRIPTION_PLAN_CREATED'
      }
    });
  } catch (error) {
    if (error instanceof DuplicateTranscriptionPlanError) {
      return res.status(409).json({
        error: {
          code: 409,
          message: error.message
        }
      });
    }

    console.error('[Transcription Plans] Create error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to create transcription plan'
      }
    });
  }
});

/**
 * @openapi
 * /transcription-plans/{id}:
 *   put:
 *     tags: [Transcription Plans]
 *     summary: Update transcription plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               monthlyMinutesLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: "Monthly limit in minutes (no minimum enforced for testing)"
 *               allowsCustomLimits:
 *                 type: boolean
 *               allowsOverage:
 *                 type: boolean
 *               sttModel:
 *                 type: string
 *               languageDetectionEnabled:
 *                 type: boolean
 *               costPerMinuteUsd:
 *                 type: number
 *               active:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       404:
 *         description: Plan not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Convert camelCase to snake_case for database
    const updates = {};
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.name !== undefined) updates.name = body.name;
    if (body.monthlyMinutesLimit !== undefined) {
      updates.monthly_minutes_limit = body.monthlyMinutesLimit;
    }
    if (body.allowsCustomLimits !== undefined) {
      updates.allows_custom_limits = body.allowsCustomLimits;
    }
    if (body.allowsOverage !== undefined) {
      updates.allows_overage = body.allowsOverage;
    }
    if (body.sttModel !== undefined) updates.stt_model = body.sttModel;
    if (body.languageDetectionEnabled !== undefined) {
      updates.language_detection_enabled = body.languageDetectionEnabled;
    }
    if (body.costPerMinuteUsd !== undefined) {
      updates.cost_per_minute_usd = body.costPerMinuteUsd;
    }
    if (body.showCost !== undefined) updates.show_cost = body.showCost;
    if (body.active !== undefined) updates.active = body.active;
    if (body.description !== undefined) updates.description = body.description;

    const plan = await TranscriptionPlan.findById(parseInt(id));
    await plan.update(updates);

    res.json({
      success: true,
      data: plan.toJSON(),
      meta: {
        code: 'TRANSCRIPTION_PLAN_UPDATED'
      }
    });
  } catch (error) {
    if (error instanceof TranscriptionPlanNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }

    console.error('[Transcription Plans] Update error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to update transcription plan'
      }
    });
  }
});

/**
 * @openapi
 * /transcription-plans/{id}:
 *   delete:
 *     tags: [Transcription Plans]
 *     summary: Soft delete transcription plan
 *     description: Sets plan.active = false instead of hard delete
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan soft deleted successfully
 *       404:
 *         description: Plan not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await TranscriptionPlan.findById(parseInt(id));
    await plan.softDelete();

    res.json({
      success: true,
      message: 'Transcription plan deactivated successfully',
      meta: {
        code: 'TRANSCRIPTION_PLAN_DELETED'
      }
    });
  } catch (error) {
    if (error instanceof TranscriptionPlanNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }

    // Handle plan in use error
    if (error.code === 'PLAN_IN_USE') {
      return res.status(400).json({
        error: {
          code: 'PLAN_IN_USE',
          message: error.message,
          usageCount: error.usageCount,
          tenantNames: error.tenantNames
        }
      });
    }

    console.error('[Transcription Plans] Delete error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to delete transcription plan'
      }
    });
  }
});

module.exports = router;
