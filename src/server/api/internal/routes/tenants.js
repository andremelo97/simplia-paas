const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const Tenant = require('../../../infra/models/Tenant');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const User = require('../../../infra/models/User');
const TenantAddress = require('../../../infra/models/TenantAddress');
const TenantContact = require('../../../infra/models/TenantContact');

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
          slug: app.applicationSlug,
          status: app.status,
          userLimit: app.userLimit,
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
 *                           notes: { type: string }
 *                           preferences: { type: object }
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
 *               notes:
 *                 type: string
 *                 example: "Responsável pela administração"
 *               preferences:
 *                 type: object
 *                 example: {"preferred_contact": "email", "business_hours": "08:00-18:00"}
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
    const { type, fullName, email, phoneE164, title, notes, preferences, isPrimary } = req.body;

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
      notes,
      preferences,
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
        error.message.includes('Phone must be in E.164') ||
        error.message.includes('Preferences must be')) {
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
 *               notes:
 *                 type: string
 *               preferences:
 *                 type: object
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
        error.message.includes('Preferences must be') ||
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

module.exports = router;