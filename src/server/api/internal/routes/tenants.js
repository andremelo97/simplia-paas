const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const Tenant = require('../../../infra/models/Tenant');
const { TenantApplication, TenantApplicationNotFoundError } = require('../../../infra/models/TenantApplication');
const { Application, ApplicationNotFoundError } = require('../../../infra/models/Application');
const User = require('../../../infra/models/User');
const { UserApplicationAccess } = require('../../../infra/models/UserApplicationAccess');
const TenantAddress = require('../../../infra/models/TenantAddress');
const TenantContact = require('../../../infra/models/TenantContact');
const database = require('../../../infra/db/database');

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
      data: tenant.toJSON(),
      metrics: {
        totalUsers,
        activeUsers,
        applications: applications.map(app => ({
          slug: app.application?.slug,
          name: app.application?.name,
          status: app.status,
          userLimit: app.maxUsers,
          seatsUsed: app.seatsUsed,
          expiresAt: app.expiresAt
        }))
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
 *                 default: active
 *                 example: "active"
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
    const { name, subdomain, status = 'active' } = req.body;

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
      meta: {
        code: "TENANT_CREATED",
        message: "Tenant created successfully."
      },
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
    const { name, status, description } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description.trim();

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
      meta: {
        code: "TENANT_UPDATED",
        message: "Tenant updated successfully."
      },
      data: tenant.toJSON()
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

// =============================================
// TENANT ADDRESS MANAGEMENT
// =============================================

/**
 * @openapi
 * /tenants/{id}/addresses:
 *   get:
 *     tags: [Tenant Management]
 *     summary: List tenant addresses
 *     description: Get all addresses for a tenant with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HQ, BILLING, SHIPPING, BRANCH, OTHER]
 *         description: Filter by address type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     addresses: 
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           type: { type: string }
 *                           label: { type: string }
 *                           line1: { type: string }
 *                           line2: { type: string }
 *                           city: { type: string }
 *                           state: { type: string }
 *                           postalCode: { type: string }
 *                           countryCode: { type: string }
 *                           isPrimary: { type: boolean }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/:id/addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, active, limit = 20, offset = 0 } = req.query;
    const tenantId = parseInt(id);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const options = {
      type,
      active: active !== undefined ? active === 'true' : undefined,
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset)
    };

    const addresses = await TenantAddress.findByTenant(tenantId, options);
    const total = await TenantAddress.count(tenantId, { type, active: options.active });

    res.json({
      success: true,
      data: {
        addresses: addresses.map(addr => addr.toJSON()),
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + addresses.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tenant addresses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch addresses'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/addresses:
 *   post:
 *     tags: [Tenant Management]
 *     summary: Create tenant address
 *     description: Add a new address to the tenant
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
 *             required: [type, line1, countryCode]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [HQ, BILLING, SHIPPING, BRANCH, OTHER]
 *                 example: "HQ"
 *               label:
 *                 type: string
 *                 example: "Headquarters São Paulo"
 *               line1:
 *                 type: string
 *                 example: "Av. Paulista, 1578"
 *               line2:
 *                 type: string
 *                 example: "Andar 15, Sala 1503"
 *               city:
 *                 type: string
 *                 example: "São Paulo"
 *               state:
 *                 type: string
 *                 example: "SP"
 *               postalCode:
 *                 type: string
 *                 example: "01310-200"
 *               countryCode:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *                 example: "BR"
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     address: { type: object }
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tenant not found
 *       409:
 *         description: Primary address conflict
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.post('/:id/addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = parseInt(id);
    const { type, label, line1, line2, city, state, postalCode, countryCode, isPrimary } = req.body;

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const address = await TenantAddress.create({
      tenantId,
      type,
      label,
      line1,
      line2,
      city,
      state,
      postalCode,
      countryCode,
      isPrimary
    });

    res.status(201).json({
      meta: {
        code: "ADDRESS_CREATED",
        message: "Address added successfully."
      },
      data: {
        address: address.toJSON()
      }
    });
  } catch (error) {
    console.error('Error creating tenant address:', error);

    if (error.message.includes('Missing required fields') || 
        error.message.includes('Invalid type') ||
        error.message.includes('countryCode must be')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error.message.includes('unique') || 
        error.message.includes('primary')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Another primary address of this type already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create address'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/addresses/{addressId}:
 *   put:
 *     tags: [Tenant Management]
 *     summary: Update tenant address
 *     description: Update an existing address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [HQ, BILLING, SHIPPING, BRANCH, OTHER]
 *               label:
 *                 type: string
 *               line1:
 *                 type: string
 *               line2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               countryCode:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     address: { type: object }
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tenant or address not found
 *       409:
 *         description: Primary address conflict
 */
router.put('/:id/addresses/:addressId', async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const tenantId = parseInt(id);
    const addressIdInt = parseInt(addressId);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const address = await TenantAddress.update(addressIdInt, tenantId, req.body);
    
    if (!address) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Address not found'
      });
    }

    res.json({
      meta: {
        code: "ADDRESS_UPDATED",
        message: "Address updated successfully."
      },
      data: {
        address: address.toJSON()
      }
    });
  } catch (error) {
    console.error('Error updating tenant address:', error);

    if (error.message.includes('Invalid type') ||
        error.message.includes('line1 is required') ||
        error.message.includes('countryCode must be') ||
        error.message.includes('No fields provided')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error.message.includes('unique') || 
        error.message.includes('primary')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Another primary address of this type already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update address'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/addresses/{addressId}:
 *   delete:
 *     tags: [Tenant Management]
 *     summary: Delete tenant address
 *     description: Soft delete (deactivate) an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       404:
 *         description: Tenant or address not found
 */
router.delete('/:id/addresses/:addressId', async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const tenantId = parseInt(id);
    const addressIdInt = parseInt(addressId);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const success = await TenantAddress.softDelete(addressIdInt, tenantId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Address not found'
      });
    }

    res.json({
      meta: {
        code: "ADDRESS_DELETED",
        message: "Address removed."
      }
    });
  } catch (error) {
    console.error('Error deleting tenant address:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete address'
    });
  }
});

// =============================================
// TENANT CONTACT MANAGEMENT
// =============================================

/**
 * @openapi
 * /tenants/{id}/contacts:
 *   get:
 *     tags: [Tenant Management]
 *     summary: List tenant contacts
 *     description: Get all contacts for a tenant with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ADMIN, BILLING, TECH, LEGAL, OTHER]
 *         description: Filter by contact type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     contacts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           type: { type: string }
 *                           fullName: { type: string }
 *                           email: { type: string }
 *                           phoneE164: { type: string }
 *                           title: { type: string }
 *                           department: { type: string }
 *                           notes: { type: string }
 *                           isPrimary: { type: boolean }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, active, limit = 20, offset = 0 } = req.query;
    const tenantId = parseInt(id);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const options = {
      type,
      active: active !== undefined ? active === 'true' : undefined,
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset)
    };

    const contacts = await TenantContact.findByTenant(tenantId, options);
    const total = await TenantContact.count(tenantId, { type, active: options.active });


    res.json({
      success: true,
      data: {
        contacts: contacts.map(contact => contact.toJSON()),
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + contacts.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tenant contacts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch contacts'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/contacts:
 *   post:
 *     tags: [Tenant Management]
 *     summary: Create tenant contact
 *     description: Add a new contact person to the tenant
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
 *             required: [type, fullName]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ADMIN, BILLING, TECH, LEGAL, OTHER]
 *                 example: "ADMIN"
 *               fullName:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@clinic.com"
 *               phoneE164:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *                 example: "+5511999887766"
 *               title:
 *                 type: string
 *                 example: "Gerente Administrativo"
 *               department:
 *                 type: string
 *                 example: "Administração"
 *               notes:
 *                 type: string
 *                 example: "Responsável pela administração"
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     contact: { type: object }
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tenant not found
 *       409:
 *         description: Primary contact conflict
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.post('/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = parseInt(id);
    const { type, fullName, email, phoneE164, title, department, notes, isPrimary } = req.body;

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const contact = await TenantContact.create({
      tenantId,
      type,
      fullName,
      email,
      phoneE164,
      title,
      department,
      notes,
      isPrimary
    });

    res.status(201).json({
      meta: {
        code: "CONTACT_CREATED",
        message: "Contact added successfully."
      },
      data: {
        contact: contact.toJSON()
      }
    });
  } catch (error) {
    console.error('Error creating tenant contact:', error);

    if (error.message.includes('Missing required fields') || 
        error.message.includes('Invalid type') ||
        error.message.includes('Invalid email format') ||
        error.message.includes('Phone must be in E.164')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error.message.includes('unique') || 
        error.message.includes('primary')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Another primary contact of this type already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create contact'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/contacts/{contactId}:
 *   put:
 *     tags: [Tenant Management]
 *     summary: Update tenant contact
 *     description: Update an existing contact person
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ADMIN, BILLING, TECH, LEGAL, OTHER]
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneE164:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               notes:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     contact: { type: object }
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tenant or contact not found
 *       409:
 *         description: Primary contact conflict
 */
router.put('/:id/contacts/:contactId', async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const tenantId = parseInt(id);
    const contactIdInt = parseInt(contactId);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const contact = await TenantContact.update(contactIdInt, tenantId, req.body);
    
    if (!contact) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Contact not found'
      });
    }

    res.json({
      meta: {
        code: "CONTACT_UPDATED",
        message: "Contact updated successfully."
      },
      data: {
        contact: contact.toJSON()
      }
    });
  } catch (error) {
    console.error('Error updating tenant contact:', error);

    if (error.message.includes('Invalid type') ||
        error.message.includes('fullName is required') ||
        error.message.includes('Invalid email format') ||
        error.message.includes('Phone must be in E.164') ||
        error.message.includes('No fields provided')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error.message.includes('unique') || 
        error.message.includes('primary')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Another primary contact of this type already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update contact'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/contacts/{contactId}:
 *   delete:
 *     tags: [Tenant Management]
 *     summary: Delete tenant contact
 *     description: Soft delete (deactivate) a contact person
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       404:
 *         description: Tenant or contact not found
 */
router.delete('/:id/contacts/:contactId', async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const tenantId = parseInt(id);
    const contactIdInt = parseInt(contactId);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const success = await TenantContact.softDelete(contactIdInt, tenantId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Contact not found'
      });
    }

    res.json({
      meta: {
        code: "CONTACT_DELETED",
        message: "Contact removed."
      }
    });
  } catch (error) {
    console.error('Error deleting tenant contact:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete contact'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/applications/{appSlug}/activate:
 *   post:
 *     tags: [Tenant Management]
 *     summary: Activate application license for tenant
 *     description: Activate a license for a specific application on a tenant (platform admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *         example: 1
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Application slug (tq, pm, billing, reports)
 *         example: "billing"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userLimit:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of users for this license
 *                 example: 50
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: License expiry date (optional)
 *                 example: "2024-12-31T23:59:59Z"
 *               status:
 *                 type: string
 *                 enum: [active, trial]
 *                 default: active
 *                 description: License status
 *                 example: "active"
 *     responses:
 *       201:
 *         description: License activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "LICENSE_ACTIVATED" }
 *                     message: { type: string, example: "License activated successfully." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     license:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         tenantId: { type: integer }
 *                         applicationSlug: { type: string }
 *                         status: { type: string }
 *                         userLimit: { type: integer }
 *                         seatsUsed: { type: integer }
 *                         expiryDate: { type: string }
 *       400:
 *         description: Validation error or license already exists
 *       404:
 *         description: Tenant or application not found
 *       409:
 *         description: License already active for this tenant and application
 */
router.post('/:id/applications/:appSlug/activate', async (req, res) => {
  try {
    const { id, appSlug } = req.params;
    const { userLimit, expiryDate, status = 'active' } = req.body;
    const tenantId = parseInt(id);

    // Validate tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    // Validate application exists by slug
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application '${appSlug}' not found`
      });
    }

    // Check if application is active
    if (application.status !== 'active') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Application '${appSlug}' is not active and cannot be licensed`
      });
    }

    // Check if license already exists
    const existingLicense = await TenantApplication.findByTenantAndApplication(tenantId, application.id);
    if (existingLicense && existingLicense.status === 'active') {
      return res.status(409).json({
        error: 'Conflict',
        message: `License for '${appSlug}' is already active for this tenant`
      });
    }

    // Validate user limit if provided
    if (userLimit && userLimit < 1) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'User limit must be greater than 0'
      });
    }

    // Create or reactivate license
    let license;
    if (existingLicense) {
      // Reactivate existing license
      license = await existingLicense.update({
        status,
        expires_at: expiryDate ? new Date(expiryDate) : null,
        max_users: userLimit
      });
    } else {
      // Create new license
      license = await TenantApplication.grantLicense({
        tenantId: tenantId,
        applicationId: application.id,
        userLimit,
        expiryDate,
        status
      });
    }

    console.log(`✅ [Platform] License activated: ${appSlug} for tenant ${tenantId}`);

    // Format response to match frontend expectations (same structure as entitlements endpoint)
    const licenseResponse = {
      id: license.id,
      application: {
        id: application.id,
        name: application.name,
        slug: application.slug,
        description: application.description
      },
      status: license.status,
      pricingSnapshot: null, // Will be populated when seats are assigned
      seatsByUserType: [], // Will be populated when users are granted access
      expiryDate: license.expiryDate,
      activatedAt: license.createdAt || license.updatedAt,
      userLimit: license.userLimit,
      seatsUsed: license.seatsUsed || 0,
      seatsAvailable: license.userLimit ? (license.userLimit - (license.seatsUsed || 0)) : null,
      totalSeatsUsed: license.seatsUsed || 0,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt
    };

    res.status(201).json({
      success: true,
      meta: {
        code: "LICENSE_ACTIVATED",
        message: "License activated successfully."
      },
      data: {
        license: licenseResponse
      }
    });

  } catch (error) {
    console.error('Error activating license:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to activate license'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/applications/{appSlug}/adjust:
 *   put:
 *     tags: [Tenant Management]
 *     summary: Adjust license seats (Platform Admin)
 *     description: Update user limit and other license settings for a tenant's application license. User limit cannot be reduced below current seats used.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Application slug (e.g., 'tq', 'pm', 'billing')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userLimit:
 *                 type: integer
 *                 minimum: 0
 *                 description: New user limit (must be >= current seats used)
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: License expiry date
 *               status:
 *                 type: string
 *                 enum: [active, trial, expired, suspended]
 *     responses:
 *       200:
 *         description: License adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "LICENSE_ADJUSTED" }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     license:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         tenantId: { type: integer }
 *                         applicationSlug: { type: string }
 *                         applicationName: { type: string }
 *                         userLimit: { type: integer, nullable: true }
 *                         seatsUsed: { type: integer }
 *                         seatsAvailable: { type: integer }
 *                         status: { type: string }
 *                         expiresAt: { type: string, format: date-time, nullable: true }
 *       422:
 *         description: Validation error - user limit below seats used
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Validation Error" }
 *                 message: { type: string }
 *                 details:
 *                   type: object
 *                   properties:
 *                     reason: { type: string, example: "TOTAL_LT_USED" }
 *                     seatsUsed: { type: integer }
 *                     requestedLimit: { type: integer }
 *       404:
 *         description: Tenant or license not found
 */
router.put('/:id/applications/:appSlug/adjust', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const { appSlug } = req.params;
    const { userLimit, expiryDate, status } = req.body;
    
    console.log(`🔄 [Platform] Adjusting license: ${appSlug} for tenant ${tenantId}`, { userLimit, expiryDate, status });
    
    // Validate tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }
    
    // Get application
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application '${appSlug}' not found`
      });
    }
    
    // Find existing license with FOR UPDATE to prevent race conditions
    const license = await TenantApplication.findByTenantAndApplicationWithLock(tenantId, application.id);
    if (!license) {
      return res.status(404).json({
        error: 'Not Found',
        message: `License for '${appSlug}' not found for this tenant`,
        details: {
          reason: 'LICENSE_NOT_FOUND',
          applicationSlug: appSlug,
          tenantId
        }
      });
    }
    
    // Validate user limit constraint
    if (userLimit !== undefined) {
      const newUserLimit = parseInt(userLimit);
      const currentSeatsUsed = license.seatsUsed || 0;
      
      if (newUserLimit < 0) {
        return res.status(422).json({
          error: 'Validation Error',
          message: 'User limit cannot be negative',
          details: {
            reason: 'INVALID_USER_LIMIT',
            requestedLimit: newUserLimit
          }
        });
      }
      
      if (newUserLimit < currentSeatsUsed) {
        return res.status(422).json({
          error: 'Validation Error',
          message: `Cannot reduce user limit below current seats used. Currently using ${currentSeatsUsed} seats.`,
          details: {
            reason: 'TOTAL_LT_USED',
            seatsUsed: currentSeatsUsed,
            requestedLimit: newUserLimit
          }
        });
      }
    }
    
    // Prepare updates
    const updates = {};
    if (userLimit !== undefined) updates.max_users = parseInt(userLimit);
    if (expiryDate !== undefined) updates.expires_at = expiryDate ? new Date(expiryDate) : null;
    if (status !== undefined) updates.status = status;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one field must be provided to adjust'
      });
    }
    
    // Update license
    const updatedLicense = await license.update(updates);
    
    console.log(`✅ [Platform] License adjusted: ${appSlug} for tenant ${tenantId}`, {
      userLimit: updatedLicense.maxUsers,
      seatsUsed: updatedLicense.seatsUsed,
      available: (updatedLicense.maxUsers || 0) - (updatedLicense.seatsUsed || 0)
    });
    
    res.json({
      success: true,
      meta: {
        code: 'LICENSE_ADJUSTED',
        message: 'License adjusted successfully'
      },
      data: {
        license: {
          id: updatedLicense.id,
          tenantId: tenantId,
          applicationSlug: appSlug,
          applicationName: application.name,
          userLimit: updatedLicense.maxUsers,
          seatsUsed: updatedLicense.seatsUsed,
          seatsAvailable: (updatedLicense.maxUsers || 0) - (updatedLicense.seatsUsed || 0),
          status: updatedLicense.status,
          expiresAt: updatedLicense.expiresAt,
          updatedAt: updatedLicense.updatedAt
        }
      }
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError || error instanceof TenantApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('❌ [Platform] Error adjusting license:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to adjust license'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/users/{userId}/applications/{appSlug}/grant:
 *   post:
 *     tags: [Tenant Management]
 *     summary: Grant application access to user (Platform Admin)
 *     description: Grant access to an application for a specific user, consuming one seat from the tenant's license. Requires valid pricing configuration.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Application slug
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleInApp:
 *                 type: string
 *                 enum: [user, operations, manager, admin]
 *                 description: Role for user in this specific application (defaults to user's general role)
 *     responses:
 *       201:
 *         description: Access granted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "ACCESS_GRANTED" }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     access:
 *                       type: object
 *                       properties:
 *                         userId: { type: integer }
 *                         applicationSlug: { type: string }
 *                         tenantId: { type: integer }
 *                         seatsRemaining: { type: integer }
 *       409:
 *         description: User already has access
 *       422:
 *         description: No seats available, license inactive, or pricing not configured
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *                 message: { type: string }
 *                 details:
 *                   type: object
 *                   properties:
 *                     reason: { type: string, example: "PRICING_NOT_CONFIGURED" }
 *                     applicationId: { type: integer }
 *                     userTypeId: { type: integer }
 */
router.post('/:id/users/:userId/applications/:appSlug/grant', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { appSlug } = req.params;
    
    console.log(`🔄 [Platform] Granting access: ${appSlug} to user ${userId} in tenant ${tenantId}`);
    
    // Validate tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }
    
    // Validate user exists and belongs to tenant
    const user = await User.findById(userId, tenantId);
    if (!user || user.tenantIdFk !== tenantId) {
      return res.status(422).json({
        error: 'Validation Error',
        message: 'User not found or does not belong to this tenant',
        details: {
          reason: 'USER_NOT_IN_TENANT',
          userId,
          tenantId
        }
      });
    }
    
    // Get application
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application '${appSlug}' not found`
      });
    }
    
    // Start transaction for seat management
    await database.query('BEGIN');
    
    try {
      // Find license with lock to prevent race conditions
      const license = await TenantApplication.findByTenantAndApplicationWithLock(tenantId, application.id);
      if (!license || license.status !== 'active') {
        await database.query('ROLLBACK');
        return res.status(422).json({
          error: 'Validation Error',
          message: `License for '${appSlug}' is not active for this tenant`,
          details: {
            reason: 'LICENSE_INACTIVE',
            applicationSlug: appSlug,
            status: license?.status || 'not_found'
          }
        });
      }
      
      // Check seat availability
      const seatsUsed = license.seatsUsed || 0;
      const userLimit = license.maxUsers;
      const seatsAvailable = userLimit ? (userLimit - seatsUsed) : Infinity;
      
      if (seatsAvailable <= 0) {
        await database.query('ROLLBACK');
        return res.status(422).json({
          error: 'Validation Error',
          message: `No seats available for '${appSlug}'. Currently using ${seatsUsed}/${userLimit} seats.`,
          details: {
            reason: 'NO_SEATS_AVAILABLE',
            seatsUsed,
            userLimit,
            seatsAvailable: 0
          }
        });
      }
      
      // Check if user already has access
      const existingAccess = await UserApplicationAccess.findByUserAndApp(userId, application.id, tenantId);
      if (existingAccess && existingAccess.isActive) {
        await database.query('ROLLBACK');
        return res.status(409).json({
          error: 'Conflict',
          message: `User already has access to '${appSlug}'`,
          details: {
            reason: 'ALREADY_GRANTED',
            userId,
            applicationSlug: appSlug
          }
        });
      }
      
      // Grant access and increment seat count using the new pricing-aware implementation
      // BE-FIX-003: Map user.role to appropriate role_in_app
      const roleInAppMapping = {
        'operations': 'operations',
        'manager': 'manager', 
        'admin': 'admin'
      };
      
      const accessData = {
        tenantIdFk: tenantId,
        userIdFk: userId,
        applicationIdFk: application.id,
        userTypeIdFkSnapshot: user.userTypeId,
        grantedByFk: req.user.userId, // Platform admin granting access
        roleInApp: req.body.roleInApp || roleInAppMapping[user.role] || 'operations', // Use provided role or map from user.role
        isActive: true
      };
      
      // Use the pricing-aware create method that validates pricing and populates snapshots
      const access = await UserApplicationAccess.create(accessData);
      await TenantApplication.incrementSeat(tenantId, application.id);
      
      await database.query('COMMIT');
      
      console.log(`✅ [Platform] Access granted: ${appSlug} to user ${userId}, seats: ${seatsUsed + 1}/${userLimit}`);
      
      res.status(201).json({
        success: true,
        meta: {
          code: 'ACCESS_GRANTED',
          message: 'Application access granted successfully'
        },
        data: {
          access: {
            userId,
            applicationSlug: appSlug,
            tenantId,
            seatsRemaining: seatsAvailable - 1,
            grantedAt: access.createdAt
          }
        }
      });
      
    } catch (innerError) {
      await database.query('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    console.error('❌ [Platform] Error granting access:', error);
    
    if (error.code === 'PRICING_NOT_CONFIGURED') {
      return res.status(422).json({
        error: 'Pricing Not Configured', 
        message: error.message,
        details: {
          reason: 'PRICING_NOT_CONFIGURED',
          applicationSlug: appSlug,
          userType: user.role || 'unknown'
        }
      });
    }
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already has access to this application',
        details: {
          reason: 'ALREADY_GRANTED'
        }
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to grant application access'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/users/{userId}/applications/{appSlug}/revoke:
 *   post:
 *     tags: [Tenant Management]
 *     summary: Revoke application access from user (Platform Admin)
 *     description: Revoke access to an application for a specific user, freeing one seat in the tenant's license
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Application slug
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "ACCESS_REVOKED" }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     seatsFreed: { type: integer, example: 1 }
 *                     seatsRemaining: { type: integer }
 *       404:
 *         description: Access not found
 */
router.post('/:id/users/:userId/applications/:appSlug/revoke', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { appSlug } = req.params;
    
    console.log(`🔄 [Platform] Revoking access: ${appSlug} from user ${userId} in tenant ${tenantId}`);
    
    // Validate tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }
    
    // Get application
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application '${appSlug}' not found`
      });
    }
    
    // Start transaction for seat management
    await database.query('BEGIN');
    
    try {
      // Find existing access
      const access = await UserApplicationAccess.findByUserAndApp(userId, application.id, tenantId);
      if (!access || !access.isActive) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          error: 'Not Found',
          message: `User does not have access to '${appSlug}'`,
          details: {
            reason: 'ACCESS_NOT_FOUND',
            userId,
            applicationSlug: appSlug
          }
        });
      }
      
      // Revoke access and decrement seat count
      await access.revoke();
      await TenantApplication.decrementSeat(tenantId, application.id);
      
      // Get updated license info
      const license = await TenantApplication.findByTenantAndApplication(tenantId, application.id);
      const seatsRemaining = license.maxUsers ? (license.maxUsers - (license.seatsUsed - 1)) : Infinity;
      
      await database.query('COMMIT');
      
      console.log(`✅ [Platform] Access revoked: ${appSlug} from user ${userId}, seats freed: 1`);
      
      res.json({
        success: true,
        meta: {
          code: 'ACCESS_REVOKED',
          message: 'Application access revoked successfully'
        },
        data: {
          seatsFreed: 1,
          seatsRemaining,
          revokedAt: new Date().toISOString()
        }
      });
      
    } catch (innerError) {
      await database.query('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    console.error('❌ [Platform] Error revoking access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to revoke application access'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/applications/{appSlug}/users:
 *   get:
 *     tags: [Tenant Management]
 *     summary: List tenant users with application access status
 *     description: Get all users in a tenant with their access status for a specific application (Platform Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Application slug (e.g., 'tq', 'pm', 'billing')
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for user name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       type: object
 *                       properties:
 *                         used: { type: integer }
 *                         total: { type: integer, nullable: true }
 *                         available: { type: integer, nullable: true }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           email: { type: string }
 *                           role: { type: string }
 *                           status: { type: string }
 *                           granted: { type: boolean }
 *                           accessId: { type: integer, nullable: true }
 *                           grantedAt: { type: string, nullable: true }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *       404:
 *         description: Tenant or application not found
 */
router.get('/:id/applications/:appSlug/users', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const { appSlug } = req.params;
    const { q, page = 1, limit = 50 } = req.query;
    
    // Validate and sanitize parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    const searchQuery = q ? String(q).trim() : null;
    
    console.log(`📋 [Platform] Listing users for app ${appSlug} in tenant ${tenantId}`, {
      search: searchQuery,
      page: pageNum,
      limit: limitNum
    });
    
    // Validate tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }
    
    // Get application by slug
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Application '${appSlug}' not found`
      });
    }
    
    // Check if tenant has license for this application
    const license = await TenantApplication.findByTenantAndApplication(tenantId, application.id);
    if (!license) {
      return res.status(404).json({
        error: 'Not Found',
        message: `License not found for application '${appSlug}'`,
        details: {
          reason: 'LICENSE_NOT_FOUND',
          tenantId,
          applicationSlug: appSlug
        }
      });
    }
    
    // Build query to get users with access status
    let baseQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.status,
        uaa.id as access_id,
        uaa.granted_at,
        uaa.active
      FROM users u
      LEFT JOIN user_application_access uaa ON u.id = uaa.user_id_fk 
        AND uaa.application_id_fk = $2 
        AND uaa.tenant_id_fk = $1
        AND uaa.active = true
      WHERE u.tenant_id_fk = $1 
        AND u.status != 'deleted'
    `;
    
    const queryParams = [tenantId, application.id];
    let paramIndex = 2;
    
    // Add search filter if provided
    if (searchQuery) {
      paramIndex++;
      baseQuery += ` AND (
        LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER($${paramIndex})
        OR LOWER(u.email) LIKE LOWER($${paramIndex})
      )`;
      queryParams.push(`%${searchQuery}%`);
    }
    
    // Add ordering and pagination
    baseQuery += ` ORDER BY u.id ASC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
    queryParams.push(limitNum, offset);
    
    // Execute query
    const result = await database.query(baseQuery, queryParams);
    
    // Count total users for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM users u 
      WHERE u.tenant_id_fk = $1 AND u.status != 'deleted'
    `;
    const countParams = [tenantId];
    
    if (searchQuery) {
      countQuery += ` AND (
        LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER($2)
        OR LOWER(u.email) LIKE LOWER($2)
      )`;
      countParams.push(`%${searchQuery}%`);
    }
    
    const countResult = await database.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Format response
    const users = result.rows.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      role: row.role,
      status: row.status,
      granted: !!row.access_id,
      accessId: row.access_id,
      grantedAt: row.granted_at
    }));
    
    // Calculate usage from license
    const usage = {
      used: license.seatsUsed || 0,
      total: license.maxUsers,
      available: license.maxUsers ? (license.maxUsers - (license.seatsUsed || 0)) : null
    };
    
    const hasMore = offset + limitNum < total;
    
    console.log(`✅ [Platform] Listed ${users.length}/${total} users, ${users.filter(u => u.granted).length} with access`);
    
    res.json({
      success: true,
      data: {
        usage,
        items: users,
        pagination: {
          total,
          limit: limitNum,
          offset,
          hasMore
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [Platform] Error listing app users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list application users'
    });
  }
});

module.exports = router;