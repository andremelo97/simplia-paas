const express = require('express');
const { PublicQuoteTemplate, PublicQuoteTemplateNotFoundError } = require('../../../infra/models/PublicQuoteTemplate');

const router = express.Router();

console.log('🔧 [Public Quote Templates Router] Public quote templates router loaded and initialized');

/**
 * @openapi
 * /tq/public-quote-templates:
 *   get:
 *     tags: [TQ - Public Quote Templates]
 *     summary: List all public quote templates for tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all public quote templates within the tenant's schema with pagination.
 *       Templates are ordered by default status (default first) then created date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of templates to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of templates to skip
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status (use isDefault=true to get default template)
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { limit, offset, active, isDefault } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      active: active !== undefined ? (active === 'true') : undefined,
      isDefault: isDefault !== undefined ? (isDefault === 'true') : undefined
    };

    const [templates, total] = await Promise.all([
      PublicQuoteTemplate.findAll(schema, options),
      PublicQuoteTemplate.count(schema, { active: options.active, isDefault: options.isDefault })
    ]);

    res.json({
      data: templates.map(t => t.toJSON()),
      meta: {
        total,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('List public quote templates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to list public quote templates'
    });
  }
});

/**
 * @openapi
 * /tq/public-quote-templates/{id}:
 *   get:
 *     tags: [TQ - Public Quote Templates]
 *     summary: Get public quote template by ID
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Retrieve a specific public quote template by ID within the tenant's schema.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID (UUID)
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { id } = req.params;

    const template = await PublicQuoteTemplate.findById(id, schema);

    res.json({
      data: template.toJSON()
    });
  } catch (error) {
    if (error instanceof PublicQuoteTemplateNotFoundError) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    console.error('Get public quote template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get public quote template'
    });
  }
});

/**
 * @openapi
 * /tq/public-quote-templates:
 *   post:
 *     tags: [TQ - Public Quote Templates]
 *     summary: Create a new public quote template
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Create a new public quote template with Puck layout configuration.
 *       Limits: Max 10 templates total, max 3 active templates per tenant.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               description:
 *                 type: string
 *                 description: Template description
 *               content:
 *                 type: object
 *                 description: Puck layout configuration (JSONB)
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Set as default template
 *               active:
 *                 type: boolean
 *                 default: true
 *                 description: Template active status
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation error (e.g., max templates reached)
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { name, description, content, isDefault, active } = req.body;

    // Validate required fields
    if (!name || !content) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'name and content are required'
      });
    }

    // Check total template limit (max 10 per tenant)
    const totalTemplates = await PublicQuoteTemplate.count(schema, {});
    if (totalTemplates >= 10) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Maximum of 10 templates allowed. Delete one before creating a new template.'
      });
    }

    // Check active template limit (max 3 active per tenant)
    // Only check if creating as active (default is active=true)
    const isActive = active !== false;
    if (isActive) {
      const activeTemplates = await PublicQuoteTemplate.count(schema, { active: true });
      if (activeTemplates >= 3) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Maximum of 3 active templates allowed. Deactivate one before creating a new active template.'
        });
      }
    }

    const template = await PublicQuoteTemplate.create(schema, {
      name,
      description,
      content,
      isDefault,
      active
    });

    res.status(201).json({
      data: template.toJSON(),
      meta: {
        code: 'PUBLIC_QUOTE_TEMPLATE_CREATED',
        message: 'Public quote template created successfully'
      }
    });
  } catch (error) {
    console.error('Create public quote template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create public quote template'
    });
  }
});

/**
 * @openapi
 * /tq/public-quote-templates/{id}:
 *   put:
 *     tags: [TQ - Public Quote Templates]
 *     summary: Update a public quote template
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Update an existing public quote template.
 *       Setting isDefault=true will unset all other defaults.
 *       Setting active=true is limited to max 3 active templates per tenant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { id } = req.params;
    const { name, description, content, isDefault, active } = req.body;

    // If activating a template, check the limit
    if (active === true) {
      // First check if the template is currently inactive
      const currentTemplate = await PublicQuoteTemplate.findById(id, schema);
      if (!currentTemplate.active) {
        // Template is being activated, check limit
        const activeTemplates = await PublicQuoteTemplate.count(schema, { active: true });
        if (activeTemplates >= 3) {
          return res.status(400).json({
            error: 'Validation error',
            message: 'Maximum of 3 active templates allowed. Deactivate one before activating this template.'
          });
        }
      }
    }

    const template = await PublicQuoteTemplate.update(id, schema, {
      name,
      description,
      content,
      isDefault,
      active
    });

    res.json({
      data: template.toJSON(),
      meta: {
        code: 'PUBLIC_QUOTE_TEMPLATE_UPDATED',
        message: 'Public quote template updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof PublicQuoteTemplateNotFoundError) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    console.error('Update public quote template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update public quote template'
    });
  }
});

/**
 * @openapi
 * /tq/public-quote-templates/{id}:
 *   delete:
 *     tags: [TQ - Public Quote Templates]
 *     summary: Delete a public quote template
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Delete a public quote template.
 *       Associated public quotes will have template_id set to NULL (ON DELETE SET NULL).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID (UUID)
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { id } = req.params;

    await PublicQuoteTemplate.delete(id, schema);

    res.json({
      meta: {
        code: 'PUBLIC_QUOTE_TEMPLATE_DELETED',
        message: 'Public quote template deleted successfully'
      }
    });
  } catch (error) {
    if (error instanceof PublicQuoteTemplateNotFoundError) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }

    console.error('Delete public quote template error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete public quote template'
    });
  }
});

module.exports = router;
