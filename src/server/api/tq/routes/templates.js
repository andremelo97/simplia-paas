const express = require('express');
const { Template, TemplateNotFoundError } = require('../../../infra/models/Template');

const router = express.Router();

console.log('🔧 [Templates Router] Templates router loaded and initialized');

/**
 * @openapi
 * /tq/templates:
 *   get:
 *     tags: [TQ - Templates]
 *     summary: List all templates for tenant
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get all templates within the tenant's schema with optional search and pagination.
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Template'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

router.get('/', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { limit, offset, active, search } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      active: active !== undefined ? (active === 'true') : undefined,
      search
    };

    const [templates, total] = await Promise.all([
      Template.findAll(schema, options),
      Template.count(schema, { active: options.active, search })
    ]);

    res.json({
      data: templates,
      meta: {
        total,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * @openapi
 * /tq/templates/most-used:
 *   get:
 *     tags: [TQ - Templates]
 *     summary: Get most used templates
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Get templates ordered by usage count (most used first).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of templates to return
 *     responses:
 *       200:
 *         description: Most used templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Template'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/most-used', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { limit } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 10
    };

    const templates = await Template.findMostUsed(schema, options);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching most used templates:', error);
    res.status(500).json({ error: 'Failed to fetch most used templates' });
  }
});

/**
 * @openapi
 * /tq/templates/{id}:
 *   get:
 *     tags: [TQ - Templates]
 *     summary: Get template by ID
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Retrieve a specific template by ID within the tenant's schema.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Template UUID
 *     responses:
 *       200:
 *         description: Template found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Template not found
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = req.tenant?.schema;

    const template = await Template.findById(id, schema);
    res.json({
      data: template
    });
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return res.status(404).json({ error: 'Template not found' });
    }
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * @openapi
 * /tq/templates:
 *   post:
 *     tags: [TQ - Templates]
 *     summary: Create a new template
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Create a new template within the tenant's schema.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Template title
 *                 example: "Dental Consultation Summary"
 *               content:
 *                 type: string
 *                 description: Template content with placeholders [placeholder], instructions (instruction), and variables $variable$
 *                 example: "Patient $patient.name$ visited on $date.now$ for [reason for visit]. Clinical findings: [examination results]. (Only include if mentioned in transcript)"
 *               description:
 *                 type: string
 *                 description: Optional template description
 *                 example: "Standard template for dental consultation summaries"
 *               active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether template is active
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, description, active } = req.body;
    const schema = req.tenant?.schema;

    // Validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      return res.status(400).json({ error: 'Title and content cannot be empty' });
    }

    const templateData = {
      title: title.trim(),
      content: content.trim(),
      description: description ? description.trim() : null,
      active: active !== undefined ? active : true
    };

    const template = await Template.create(templateData, schema);
    res.status(201).json({
      data: template,
      meta: {
        code: 'TEMPLATE_CREATED',
        message: 'Template created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * @openapi
 * /tq/templates/{id}:
 *   put:
 *     tags: [TQ - Templates]
 *     summary: Update template
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Update an existing template within the tenant's schema.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Template UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Template title
 *               content:
 *                 type: string
 *                 description: Template content with placeholders and variables
 *               description:
 *                 type: string
 *                 description: Template description
 *               active:
 *                 type: boolean
 *                 description: Whether template is active
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Template not found
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, description, active } = req.body;
    const schema = req.tenant?.schema;

    const updates = {};

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }
      updates.content = content.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (active !== undefined) {
      updates.active = active;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    const template = await Template.update(id, updates, schema);
    res.json({
      data: template,
      meta: {
        code: 'TEMPLATE_UPDATED',
        message: 'Template updated successfully'
      }
    });
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return res.status(404).json({ error: 'Template not found' });
    }
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * @openapi
 * /tq/templates/{id}:
 *   delete:
 *     tags: [TQ - Templates]
 *     summary: Delete template (soft delete)
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Soft delete a template by setting active to false.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Template UUID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Template not found
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schema = req.tenant?.schema;

    const template = await Template.delete(id, schema);
    res.json({
      data: template,
      meta: {
        code: 'TEMPLATE_DELETED',
        message: 'Template deleted successfully'
      }
    });
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return res.status(404).json({ error: 'Template not found' });
    }
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});


/**
 * @openapi
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Template UUID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         title:
 *           type: string
 *           description: Template title
 *         content:
 *           type: string
 *           description: Template content with placeholders [placeholder], instructions (instruction), and variables $variable$
 *         description:
 *           type: string
 *           nullable: true
 *           description: Template description
 *         active:
 *           type: boolean
 *           description: Whether template is active
 *         usageCount:
 *           type: integer
 *           description: Number of times template has been used
 *       example:
 *         id: "550e8400-e29b-41d4-a716-446655440000"
 *         createdAt: "2025-01-20T10:30:00Z"
 *         updatedAt: "2025-01-20T10:30:00Z"
 *         title: "Dental Consultation Summary"
 *         content: "Patient $patient.name$ visited on $date.now$ for [reason for visit]. Clinical findings: [examination results]. (Only include if mentioned in transcript)"
 *         description: "Standard template for dental consultation summaries"
 *         active: true
 *         usageCount: 5
 */

module.exports = router;