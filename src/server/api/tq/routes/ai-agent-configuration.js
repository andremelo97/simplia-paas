const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, requireAdmin } = require('../../../infra/middleware/auth');
const { getLocaleFromTimezone } = require('../../../infra/utils/localeMapping');
const { AIAgentConfiguration, AIAgentConfigurationNotFoundError } = require('../../../infra/models/AIAgentConfiguration');

const router = express.Router();

// Apply tenant middleware to all configuration routes
router.use(tenantMiddleware);

// Apply authentication to all configuration routes
router.use(requireAuth);

console.log('🔧 [AI Agent Configuration Router] AI Agent Configuration router loaded and initialized');

/**
 * @openapi
 * /tq/configurations/ai-agent:
 *   get:
 *     tags: [TQ - Configurations]
 *     summary: Get AI Agent configuration
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get AI Agent configuration for the current tenant.
 *       Returns default values if no configuration has been saved yet.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     systemMessage:
 *                       type: string
 *                       description: Custom AI Agent system message template
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       400:
 *         description: Missing tenant context
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const locale = getLocaleFromTimezone(req.tenant?.timezone);
    const config = await AIAgentConfiguration.findByTenant(schema, locale);

    res.json({
      data: config.id ? config.toJSON() : config,
      meta: {
        code: 'AI_AGENT_CONFIGURATION_RETRIEVED',
        message: 'AI Agent configuration retrieved successfully'
      }
    });
  } catch (error) {
    console.error('Error fetching AI Agent configuration:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch AI Agent configuration'
    });
  }
});

/**
 * @openapi
 * /tq/configurations/ai-agent:
 *   put:
 *     tags: [TQ - Configurations]
 *     summary: Update AI Agent configuration
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Update AI Agent configuration for the current tenant.
 *       Creates a new configuration if none exists.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               systemMessage:
 *                 type: string
 *                 description: Custom AI Agent system message template
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     systemMessage:
 *                       type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       400:
 *         description: Missing tenant context or validation error
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.put('/', requireAdmin, async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const { systemMessage } = req.body;

    if (systemMessage === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: systemMessage'
      });
    }

    const config = await AIAgentConfiguration.upsert(schema, {
      systemMessage
    });

    res.json({
      data: config.toJSON(),
      meta: {
        code: 'AI_AGENT_CONFIGURATION_UPDATED',
        message: 'AI Agent configuration updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating AI Agent configuration:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update AI Agent configuration'
    });
  }
});

/**
 * @openapi
 * /tq/configurations/ai-agent/reset:
 *   post:
 *     tags: [TQ - Configurations]
 *     summary: Reset AI Agent configuration to defaults
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Reset AI Agent configuration to default values for the current tenant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier
 *     responses:
 *       200:
 *         description: Configuration reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     systemMessage:
 *                       type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       400:
 *         description: Missing tenant context
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/reset', requireAdmin, async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const locale = getLocaleFromTimezone(req.tenant?.timezone);
    const config = await AIAgentConfiguration.reset(schema, locale);

    res.json({
      data: config.toJSON(),
      meta: {
        code: 'AI_AGENT_CONFIGURATION_RESET',
        message: 'AI Agent configuration reset to defaults successfully'
      }
    });
  } catch (error) {
    console.error('Error resetting AI Agent configuration:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reset AI Agent configuration'
    });
  }
});

module.exports = router;

