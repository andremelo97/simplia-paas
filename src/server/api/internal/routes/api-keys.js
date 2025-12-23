const express = require('express');
const { ApiKey, ApiKeyNotFoundError } = require('../../../infra/models/ApiKey');

const router = express.Router();

/**
 * @openapi
 * /api-keys:
 *   get:
 *     tags: [API Keys]
 *     summary: List all API keys
 *     description: |
 *       **Scope:** Platform (requires internal_admin role)
 *
 *       Returns all API keys (active by default).
 *       Key hashes are never returned.
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *         description: Filter by scope (provisioning, billing, etc.)
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include revoked keys
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/', async (req, res) => {
  try {
    const { scope, includeInactive } = req.query;

    const apiKeys = await ApiKey.findAll({
      scope,
      includeInactive: includeInactive === 'true'
    });

    res.json({
      data: apiKeys.map(k => k.toJSON()),
      meta: {
        total: apiKeys.length
      }
    });
  } catch (error) {
    console.error('[API Keys] Error listing keys:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list API keys'
      }
    });
  }
});

/**
 * @openapi
 * /api-keys:
 *   post:
 *     tags: [API Keys]
 *     summary: Create a new API key
 *     description: |
 *       **Scope:** Platform (requires internal_admin role)
 *
 *       Creates a new API key. The plain key is returned ONLY in this response.
 *       Store it securely - it cannot be retrieved again.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the key
 *                 example: "N8N Production"
 *               scope:
 *                 type: string
 *                 description: Permission scope
 *                 default: provisioning
 *                 example: provisioning
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date (null = never expires)
 *     responses:
 *       201:
 *         description: API key created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { name, scope = 'provisioning', expiresAt = null } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required'
        }
      });
    }

    // Get user ID from JWT if available
    const createdByFk = req.user?.userId || null;

    const { apiKey, plainKey } = await ApiKey.create({
      name: name.trim(),
      scope,
      createdByFk,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.status(201).json({
      data: {
        ...apiKey.toJSON(),
        key: plainKey // Only returned on creation
      },
      meta: {
        code: 'API_KEY_CREATED',
        message: 'API key created successfully.'
      }
    });
  } catch (error) {
    console.error('[API Keys] Error creating key:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API key'
      }
    });
  }
});

/**
 * @openapi
 * /api-keys/{id}:
 *   get:
 *     tags: [API Keys]
 *     summary: Get API key by ID
 *     description: |
 *       **Scope:** Platform (requires internal_admin role)
 *
 *       Returns API key metadata. Key hash is never returned.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: API key details
 *       404:
 *         description: API key not found
 */
router.get('/:id', async (req, res) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id);

    res.json({
      data: apiKey.toJSON()
    });
  } catch (error) {
    if (error instanceof ApiKeyNotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'API key not found'
        }
      });
    }

    console.error('[API Keys] Error getting key:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get API key'
      }
    });
  }
});

/**
 * @openapi
 * /api-keys/{id}:
 *   put:
 *     tags: [API Keys]
 *     summary: Update API key metadata
 *     description: |
 *       **Scope:** Platform (requires internal_admin role)
 *
 *       Updates API key name or expiration. Cannot change the key itself.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: API key updated
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, expiresAt } = req.body;

    const apiKey = await ApiKey.update(req.params.id, {
      name,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.json({
      data: apiKey.toJSON(),
      meta: {
        code: 'API_KEY_UPDATED',
        message: 'API key updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof ApiKeyNotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'API key not found'
        }
      });
    }

    console.error('[API Keys] Error updating key:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update API key'
      }
    });
  }
});

/**
 * @openapi
 * /api-keys/{id}:
 *   delete:
 *     tags: [API Keys]
 *     summary: Revoke API key
 *     description: |
 *       **Scope:** Platform (requires internal_admin role)
 *
 *       Revokes (soft deletes) an API key. The key can no longer be used.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: API key revoked
 */
router.delete('/:id', async (req, res) => {
  try {
    const apiKey = await ApiKey.revoke(req.params.id);

    res.json({
      data: apiKey.toJSON(),
      meta: {
        code: 'API_KEY_REVOKED',
        message: 'API key revoked successfully'
      }
    });
  } catch (error) {
    if (error instanceof ApiKeyNotFoundError) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'API key not found'
        }
      });
    }

    console.error('[API Keys] Error revoking key:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revoke API key'
      }
    });
  }
});

module.exports = router;
