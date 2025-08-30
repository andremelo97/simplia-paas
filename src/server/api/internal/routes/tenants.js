const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const { Tenant } = require('../../../infra/models/Tenant');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const { User } = require('../../../infra/models/User');

const router = express.Router();

// All tenant management routes require platform admin role
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /tenants:
 *   get:
 *     tags: [Tenant Management]
 *     summary: List all tenants
 *     description: Get paginated list of all tenants in the system with operational metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, trial, expired, suspended, inactive]
 *         description: Filter by tenant status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *         description: Number of tenants to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of tenants to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by tenant name or subdomain
 *     responses:
 *       200:
 *         description: List of tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           subdomain: { type: string }
 *                           schemaName: { type: string }
 *                           status: { type: string }
 *                           userCount: { type: integer }
 *                           activeApplications: { type: integer }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 25, offset = 0, search } = req.query;
    
    const options = {
      status,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      search
    };

    const tenants = await Tenant.findAll(options);
    const total = await Tenant.count(options);

    // Enrich with operational metrics
    const enrichedTenants = await Promise.all(
      tenants.map(async (tenant) => {
        const userCount = await User.countByTenant(tenant.id);
        const activeApplications = await TenantApplication.countActiveLicenses(tenant.id);
        
        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          schemaName: tenant.schemaName,
          status: tenant.status,
          userCount,
          activeApplications,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        tenants: enrichedTenants,
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + enrichedTenants.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenants'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}:
 *   get:
 *     tags: [Tenant Management]
 *     summary: Get tenant details
 *     description: Get detailed information about a specific tenant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         name: { type: string }
 *                         subdomain: { type: string }
 *                         schemaName: { type: string }
 *                         status: { type: string }
 *                         active: { type: boolean }
 *                         createdAt: { type: string }
 *                         updatedAt: { type: string }
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalUsers: { type: integer }
 *                         activeUsers: { type: integer }
 *                         applications:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               slug: { type: string }
 *                               status: { type: string }
 *                               userLimit: { type: integer }
 *                               seatsUsed: { type: integer }
 *                               expiresAt: { type: string }
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await Tenant.findById(parseInt(id));
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    // Get detailed metrics
    const totalUsers = await User.countByTenant(tenant.id);
    const activeUsers = await User.countByTenant(tenant.id, { status: 'active' });
    const applications = await TenantApplication.findByTenant(tenant.id);

    res.json({
      success: true,
      data: {
        tenant: tenant.toJSON(),
        metrics: {
          totalUsers,
          activeUsers,
          applications: applications.map(app => ({
            slug: app.applicationSlug,
            status: app.status,
            userLimit: app.userLimit,
            seatsUsed: app.seatsUsed,
            expiresAt: app.expiresAt
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant'
    });
  }
});

/**
 * @openapi
 * /tenants:
 *   post:
 *     tags: [Tenant Management]
 *     summary: Create new tenant
 *     description: Create a new tenant with schema and initial configuration
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, subdomain]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Acme Corporation"
 *               subdomain:
 *                 type: string
 *                 pattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
 *                 minLength: 3
 *                 maxLength: 63
 *                 example: "acme-corp"
 *               status:
 *                 type: string
 *                 enum: [active, trial, inactive]
 *                 default: trial
 *                 example: "trial"
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant: { type: object }
 *       400:
 *         description: Validation error
 *       409:
 *         description: Subdomain already exists
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.post('/', async (req, res) => {
  try {
    const { name, subdomain, status = 'trial' } = req.body;

    // Basic validation
    if (!name || !subdomain) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name and subdomain are required'
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Subdomain must contain only lowercase letters, numbers, and hyphens'
      });
    }

    // Generate schema name from subdomain
    const schemaName = `tenant_${subdomain.replace(/-/g, '_')}`;

    const tenant = await Tenant.create({
      name: name.trim(),
      subdomain: subdomain.toLowerCase().trim(),
      schemaName,
      status
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant: tenant.toJSON()
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);

    if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Subdomain already exists'
      });
    }

    if (error.message.includes('validation')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create tenant'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}:
 *   put:
 *     tags: [Tenant Management]
 *     summary: Update tenant
 *     description: Update tenant information and status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Acme Corporation Updated"
 *               status:
 *                 type: string
 *                 enum: [active, trial, expired, suspended, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant: { type: object }
 *       404:
 *         description: Tenant not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least one field must be provided for update'
      });
    }

    const tenant = await Tenant.update(parseInt(id), updateData);
    
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: {
        tenant: tenant.toJSON()
      }
    });
  } catch (error) {
    console.error('Error updating tenant:', error);

    if (error.message.includes('validation')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update tenant'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}:
 *   delete:
 *     tags: [Tenant Management]
 *     summary: Deactivate tenant
 *     description: Soft delete (deactivate) a tenant - sets active=false, preserves data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Tenant.deactivate(parseInt(id));
    
    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      message: 'Tenant deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating tenant:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to deactivate tenant'
    });
  }
});

module.exports = router;