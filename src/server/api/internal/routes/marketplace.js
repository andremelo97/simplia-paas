const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { MarketplaceItem, MarketplaceItemNotFoundError } = require('../../../infra/models/MarketplaceItem');
const { Template } = require('../../../infra/models/Template');
const { LandingPageTemplate } = require('../../../infra/models/LandingPageTemplate');

// Browsing router (auth only, no tenant context)
const browsingRouter = express.Router();
browsingRouter.use(requireAuth);

/**
 * GET /marketplace
 * List marketplace items with filters
 */
browsingRouter.get('/', async (req, res) => {
  try {
    const { type, specialty, locale, search, limit = 50, offset = 0 } = req.query;

    const options = {
      type: type || undefined,
      specialty: specialty || undefined,
      locale: locale || undefined,
      search: search || undefined,
      limit: Math.min(parseInt(limit) || 50, 100),
      offset: parseInt(offset) || 0
    };

    const [items, total] = await Promise.all([
      MarketplaceItem.findAll(options),
      MarketplaceItem.count(options)
    ]);

    res.json({
      data: items.map(item => item.toJSON()),
      meta: {
        total,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('Marketplace list error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch marketplace items'
    });
  }
});

/**
 * GET /marketplace/:id
 * Get marketplace item detail (with content)
 */
browsingRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid item ID'
      });
    }

    const item = await MarketplaceItem.findById(id);

    res.json({
      data: item.toJSONWithContent()
    });
  } catch (error) {
    if (error instanceof MarketplaceItemNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Marketplace item not found'
      });
    }

    console.error('Marketplace detail error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch marketplace item'
    });
  }
});

// Import router (tenant-scoped — mounted inside tenantScopedRouter)
const importRouter = express.Router();

/**
 * POST /marketplace/:id/import
 * Import a marketplace item into the tenant's TQ
 */
importRouter.post('/:id/import', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const schema = req.tenant?.schema;

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid item ID'
      });
    }

    if (!schema) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Tenant context required for import'
      });
    }

    const item = await MarketplaceItem.findById(id);
    let importedId;

    if (item.type === 'template') {
      // Template.create(templateData, schema) — data first, schema second
      const created = await Template.create({
        title: item.title,
        content: item.content,
        description: item.description,
        active: true
      }, schema);
      importedId = created.id;
    } else if (item.type === 'landing_page') {
      // Check total LP template limit (max 10 per tenant)
      const totalCount = await LandingPageTemplate.count(schema, {});
      if (totalCount >= 10) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Maximum of 10 landing page templates allowed.',
          meta: { code: 'MARKETPLACE_LP_LIMIT_REACHED' }
        });
      }

      // Check active LP template count — import succeeds but enters inactive if at limit
      const activeCount = await LandingPageTemplate.count(schema, { active: true });
      const shouldBeActive = activeCount < 5;

      // LandingPageTemplate.create(schema, data) — schema first, data second
      const created = await LandingPageTemplate.create(schema, {
        name: item.title,
        description: item.description,
        content: item.content,
        isDefault: false,
        active: shouldBeActive
      });
      importedId = created.id;
    }

    // Increment import count (fire-and-forget)
    MarketplaceItem.incrementImportCount(id).catch(err =>
      console.warn('Failed to increment import count:', err)
    );

    res.json({
      data: {
        importedId,
        type: item.type
      },
      meta: {
        code: 'MARKETPLACE_TEMPLATE_IMPORTED',
        message: 'Template imported successfully'
      }
    });
  } catch (error) {
    if (error instanceof MarketplaceItemNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Marketplace item not found'
      });
    }

    console.error('Marketplace import error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to import marketplace item'
    });
  }
});

module.exports = { browsingRouter, importRouter };
