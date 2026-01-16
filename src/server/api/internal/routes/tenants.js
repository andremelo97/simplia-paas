const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const { Tenant } = require('../../../infra/models/Tenant');
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
 * /tenants/users:
 *   get:
 *     tags: [Tenants]
 *     summary: List users globally with tenant filter
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get all users across all tenants with optional tenant filtering (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by specific tenant ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of users to skip
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           email: { type: string }
 *                           firstName: { type: string }
 *                           lastName: { type: string }
 *                           name: { type: string }
 *                           role: { type: string }
 *                           status: { type: string }
 *                           tenantIdFk: { type: integer }
 *                           tenantName: { type: string }
 *                           lastLogin: { type: string, format: date-time, nullable: true }
 *                           createdAt: { type: string }
 *                           updatedAt: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *       403:
 *         description: Insufficient permissions (internal_admin required)
 */
router.get('/users', async (req, res) => {
  try {
    const { tenantId, search, status, limit = 50, offset = 0 } = req.query;

    const options = {
      tenantId: tenantId ? parseInt(tenantId) : undefined,
      search,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // Get users with the specified options
    const users = await User.findAll(options);

    // Get total count for pagination (simplified for now)
    const totalUsers = users.length; // This should be improved to get actual total count

    res.json({
      success: true,
      data: {
        users: users.map(user => {
          const userData = user.toJSON();
          // Ensure consistent field mapping for frontend
          return {
            ...userData,
            tenantId: userData.tenantIdFk,
            tenantName: userData.tenantName || `Tenant ${userData.tenantIdFk}`,
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
          };
        }),
        pagination: {
          total: totalUsers,
          limit: options.limit,
          offset: options.offset,
          hasMore: false // Will be calculated properly when we implement real count
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get users'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/users/all:
 *   get:
 *     tags: [Tenants]
 *     summary: List all users with filters (for automation)
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Returns all users across all tenants with optional filters.
 *       Designed for n8n/automation workflows (e.g., onboarding emails).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [admin, manager, operations]
 *         description: Filter by user role
 *       - name: createdAfter
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter users created after this date (ISO 8601)
 *       - name: createdBefore
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter users created before this date (ISO 8601)
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of users to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions (internal_admin required)
 */
router.get('/users/all', async (req, res) => {
  try {
    const {
      role,
      createdAfter,
      createdBefore,
      limit = 100,
      offset = 0
    } = req.query;

    // Build query conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }

    if (createdAfter) {
      conditions.push(`u.created_at >= $${paramIndex++}`);
      params.push(new Date(createdAfter));
    }

    if (createdBefore) {
      conditions.push(`u.created_at <= $${paramIndex++}`);
      params.push(new Date(createdBefore));
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Query users with tenant info
    const query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.active,
        u.created_at,
        u.tenant_id_fk as tenant_id,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain
      FROM platform.users u
      LEFT JOIN platform.tenants t ON t.id = u.tenant_id_fk
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await database.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM platform.users u
      ${whereClause}
    `;
    const countResult = await database.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        users: result.rows.map(row => ({
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
          role: row.role,
          active: row.active,
          createdAt: row.created_at,
          tenant: {
            id: row.tenant_id,
            name: row.tenant_name,
            subdomain: row.tenant_subdomain
          }
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + result.rows.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get all users for automation error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get users'
      }
    });
  }
});

/**
 * @openapi
 * /tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: List all tenants
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get paginated list of all tenants in the system with operational metrics
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
 *     tags: [Tenants]
 *     summary: Get tenant details
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get detailed information about a specific tenant
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
 *                   description: |
 *                     Basic tenant information only. For user metrics and application data,
 *                     use dedicated endpoints: /users and /tenants/{tenantId}/applications
 *                   properties:
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     subdomain: { type: string }
 *                     schemaName: { type: string }
 *                     status: { type: string }
 *                     active: { type: boolean }
 *                     createdAt: { type: string }
 *                     updatedAt: { type: string }
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

    res.json({
      success: true,
      data: tenant.toJSON()
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
 *     tags: [Tenants]
 *     summary: Create new tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Create a new tenant with schema and initial configuration
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
    const { name, subdomain, timezone, status = 'active' } = req.body;

    // Basic validation
    if (!name || !subdomain || !timezone) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, subdomain, and timezone are required'
      });
    }

    // Validate timezone against PostgreSQL's timezone list
    try {
      const timezoneValidation = await database.query(
        'SELECT 1 FROM pg_timezone_names WHERE name = $1',
        [timezone]
      );

      if (timezoneValidation.rows.length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier.`
        });
      }
    } catch (tzError) {
      console.error('Error validating timezone:', tzError);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid timezone format'
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

    // Check for duplicate tenant name
    const existingTenantByName = await Tenant.findByName(name.trim());
    if (existingTenantByName) {
      return res.status(409).json({
        error: {
          code: 'TENANT_NAME_ALREADY_EXISTS',
          message: `A tenant with the name "${name.trim()}" already exists. Please choose a different name.`
        }
      });
    }

    // Generate schema name from subdomain
    const schemaName = `tenant_${subdomain.replace(/-/g, '_')}`;

    const tenant = await Tenant.create({
      name: name.trim(),
      subdomain: subdomain.toLowerCase().trim(),
      schemaName,
      timezone: timezone.trim(),
      status
    });

    // Create the tenant schema in PostgreSQL
    await Tenant.createSchema(schemaName);

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
 *     tags: [Tenants]
 *     summary: Update tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update tenant information and status
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
    const { name, status, description, timezone } = req.body;

    // Reject timezone changes explicitly
    if (timezone !== undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Timezone cannot be changed after tenant creation'
      });
    }

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
 *     tags: [Tenants]
 *     summary: Deactivate tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Soft delete (deactivate) a tenant - sets active=false, preserves data
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
 *     tags: [Tenants]
 *     summary: List tenant addresses
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get all addresses for a tenant with filtering options
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
 *     tags: [Tenants]
 *     summary: Create tenant address
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Add a new address to the tenant
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
 *     tags: [Tenants]
 *     summary: Update tenant address
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update an existing address
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
 *     tags: [Tenants]
 *     summary: Delete tenant address
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Permanently delete an address from the database
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

    const success = await TenantAddress.hardDelete(addressIdInt, tenantId);
    
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
 *     tags: [Tenants]
 *     summary: List tenant contacts
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get all contacts for a tenant with filtering options
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
 *                           phone: { type: string }
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
 *     tags: [Tenants]
 *     summary: Create tenant contact
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Add a new contact person to the tenant
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
 *               phone:
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
    const { type, fullName, email, phone, title, department, notes, isPrimary } = req.body;

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
      phone,
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
 *     tags: [Tenants]
 *     summary: Update tenant contact
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update an existing contact person
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
 *               phone:
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
 *     tags: [Tenants]
 *     summary: Delete tenant contact
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Permanently delete a contact person from the database
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

    const success = await TenantContact.hardDelete(contactIdInt, tenantId);
    
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
 * @swagger
 * /tenants/{id}/applications:
 *   get:
 *     tags: [Tenants]
 *     summary: Get applications licensed to a specific tenant
 *     description: |
 *       **Scope:** Platform (Internal Admin)
 *
 *       Returns all applications that have active licenses for the specified tenant,
 *       including seat usage, limits, and expiration information.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric tenant ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, expired]
 *           default: active
 *         description: Filter by license status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of applications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of applications to skip for pagination
 *     responses:
 *       200:
 *         description: Successful response with tenant's licensed applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       slug:
 *                         type: string
 *                         description: Application unique identifier
 *                         example: "tq"
 *                       name:
 *                         type: string
 *                         description: Application display name
 *                         example: "TQ - Quality Management"
 *                       status:
 *                         type: string
 *                         description: License status for this tenant
 *                         enum: [active, suspended, expired]
 *                         example: "active"
 *                       userLimit:
 *                         type: integer
 *                         nullable: true
 *                         description: Maximum users allowed (null = unlimited)
 *                         example: 50
 *                       seatsUsed:
 *                         type: integer
 *                         description: Current number of seats occupied
 *                         example: 12
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: License expiration date (null = never expires)
 *                         example: "2024-12-31T23:59:59Z"
 *                 tenantId:
 *                   type: integer
 *                   description: The tenant ID for which licenses were retrieved
 *                   example: 2
 *       400:
 *         description: Bad Request - Invalid tenant ID
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Not Found - Tenant not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id/applications', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);
    const { status = 'active', limit = 50, offset = 0 } = req.query;

    if (!tenantId || isNaN(tenantId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid tenant ID'
      });
    }

    const licensedApps = await Application.findByTenant(tenantId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      applications: licensedApps.map(app => ({
        slug: app.slug,
        name: app.name,
        status: app.tenantStatus || app.status,
        seatsPurchased: app.seatsPurchased,
        seatsUsed: app.seatsUsed || 0,
        expiresAt: app.expiresAt
      })),
      tenantId
    });
  } catch (error) {
    console.error('Error fetching tenant applications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch tenant applications'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/applications/{appSlug}/activate:
 *   post:
 *     tags: [Tenants]
 *     summary: Activate application license for tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Activate a license for a specific application on a tenant (platform admin only)
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
        seats_purchased: userLimit
      });
    } else {
      // Create new license
      license = await TenantApplication.grantLicense({
        tenantId: tenantId,
        applicationId: application.id,
        seatsPurchased: userLimit,
        expiresAt: expiryDate,
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
      expiresAt: license.expiresAt,
      activatedAt: license.createdAt || license.updatedAt,
      seatsPurchased: license.seatsPurchased,
      seatsUsed: license.seatsUsed || 0,
      seatsAvailable: license.seatsPurchased ? (license.seatsPurchased - (license.seatsUsed || 0)) : null,
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
 *     tags: [Tenants]
 *     summary: Adjust license seats (Platform Admin)
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update user limit and other license settings for a tenant's application license. User limit cannot be reduced below current seats used.
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
    if (userLimit !== undefined) updates.seats_purchased = parseInt(userLimit);
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
      seatsPurchased: updatedLicense.seatsPurchased,
      seatsUsed: updatedLicense.seatsUsed,
      available: (updatedLicense.seatsPurchased || 0) - (updatedLicense.seatsUsed || 0)
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
          seatsPurchased: updatedLicense.seatsPurchased,
          seatsUsed: updatedLicense.seatsUsed,
          seatsAvailable: (updatedLicense.seatsPurchased || 0) - (updatedLicense.seatsUsed || 0),
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
 *     tags: [Licenses]
 *     summary: Grant application access to user (Platform Admin)
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Grant access to an application for a specific user, consuming one seat from the tenant's license. Requires valid pricing configuration.
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
  const tenantId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { appSlug } = req.params;

  let user; // Declare user outside try block for error handler access

  try {

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
    user = await User.findById(userId, tenantId);
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
      const seatsPurchased = license.seatsPurchased;
      const seatsAvailable = seatsPurchased ? (seatsPurchased - seatsUsed) : Infinity;
      
      if (seatsAvailable <= 0) {
        await database.query('ROLLBACK');
        return res.status(422).json({
          error: 'Validation Error',
          message: `No seats available for '${appSlug}'. Currently using ${seatsUsed}/${seatsPurchased} seats.`,
          details: {
            reason: 'NO_SEATS_AVAILABLE',
            seatsUsed,
            seatsPurchased,
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
      
      console.log(`✅ [Platform] Access granted: ${appSlug} to user ${userId}, seats: ${seatsUsed + 1}/${seatsPurchased}`);
      
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
          userType: user?.role || 'unknown'
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
 *     tags: [Licenses]
 *     summary: Revoke application access from user (Platform Admin)
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Revoke access to an application for a specific user, freeing one seat in the tenant's license
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
  const tenantId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { appSlug } = req.params;

  try {
    
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
      const seatsRemaining = license.seatsPurchased ? (license.seatsPurchased - (license.seatsUsed - 1)) : Infinity;
      
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
 *     tags: [Tenants]
 *     summary: List assigned users for application
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get list of users assigned to a specific application within a tenant
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
 *         description: Application slug
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of assigned users
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           grantedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       404:
 *         description: Tenant or application not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/applications/:appSlug/users', async (req, res) => {
  try {
    const { id, appSlug } = req.params;
    const tenantId = parseInt(id);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    if (isNaN(tenantId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid tenant ID'
      });
    }

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    // Find application by slug
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // Get all users with access status details
    const query = `
      SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.role,
        u.status,
        uaa.id as access_id,
        uaa.granted_at,
        uaa.role_in_app,
        COALESCE(uaa.active, false) as granted
      FROM users u
      LEFT JOIN user_application_access uaa ON u.id = uaa.user_id_fk
        AND uaa.application_id_fk = $2
        AND uaa.tenant_id_fk = $1
      WHERE u.tenant_id_fk = $1
        AND u.active = true
      ORDER BY uaa.granted_at DESC NULLS LAST, u.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.tenant_id_fk = $1
        AND u.active = true
    `;

    const [usersResult, countResult] = await Promise.all([
      database.query(query, [tenantId, application.id, limit, offset]),
      database.query(countQuery, [tenantId])
    ]);

    const users = usersResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      granted: user.granted,
      accessId: user.access_id,
      grantedAt: user.granted_at,
      roleInApp: user.role_in_app // Application-specific role
    }));

    const total = parseInt(countResult.rows[0].total);
    const hasMore = offset + limit < total;

    // Calculate usage statistics
    const usedSeats = users.filter(user => user.granted).length;
    
    // Get license info for seat limits
    const licenseQuery = `
      SELECT seats_purchased, seats_used
      FROM tenant_applications
      WHERE tenant_id_fk = $1 AND application_id_fk = $2 AND active = true
    `;
    const licenseResult = await database.query(licenseQuery, [tenantId, application.id]);
    const license = licenseResult.rows[0];

    const usage = {
      used: license ? license.seats_used : usedSeats,
      total: license ? license.seats_purchased : null,
      available: license && license.seats_purchased ? Math.max(0, license.seats_purchased - license.seats_used) : null
    };

    res.json({
      success: true,
      data: {
        users,
        usage,
        pagination: {
          total,
          limit,
          offset,
          hasMore
        }
      }
    });

  } catch (error) {
    console.error('❌ [Platform] Error listing application users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list application users'
    });
  }
});

/**
 * @swagger
 * /tenants/{id}/users/{userId}/applications/{appSlug}/reactivate:
 *   put:
 *     summary: Reactivate user access to application
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Reactivates a user's access to an application by setting active=true
 *     tags: [Licenses]
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
 *         description: Access reactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     access:
 *                       type: object
 *       404:
 *         description: Tenant, user, application, or access record not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/users/:userId/applications/:appSlug/reactivate', async (req, res) => {
  try {
    const { id, userId, appSlug } = req.params;
    const tenantId = parseInt(id);
    const targetUserId = parseInt(userId);

    if (isNaN(tenantId) || isNaN(targetUserId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid tenant ID or user ID'
      });
    }

    console.log(`🔄 [Platform] Reactivating access: ${appSlug} for user ${targetUserId} in tenant ${tenantId}`);

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    // Verify user exists in tenant
    const user = await User.findById(targetUserId, tenantId);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in tenant'
      });
    }

    // Verify application exists
    const application = await Application.findBySlug(appSlug);
    if (!application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // Find existing access record
    const existingAccess = await UserApplicationAccess.findByUserAndApp(
      targetUserId, 
      application.id, 
      tenantId
    );

    if (!existingAccess) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No existing access record found for this user and application'
      });
    }

    // Reactivate the access
    const reactivatedAccess = await UserApplicationAccess.reactivate(
      targetUserId,
      application.id,
      tenantId
    );

    // Increment seat count since user is getting access back
    await TenantApplication.incrementSeat(tenantId, application.id);

    console.log(`✅ [Platform] Access reactivated successfully for user ${targetUserId} to app ${appSlug}`);

    res.json({
      success: true,
      meta: {
        code: 'ACCESS_REACTIVATED',
        message: 'User access reactivated successfully'
      },
      data: {
        access: reactivatedAccess
      }
    });

  } catch (error) {
    console.error('❌ [Platform] Error reactivating access:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to reactivate user access'
    });
  }
});

/**
 * @openapi
 * /tenants/{id}/users/{userId}/applications/{appSlug}/role:
 *   put:
 *     tags: [Licenses]
 *     summary: Update user role in application (Platform Admin)
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update the role_in_app field for a specific user in a specific application.
 *       Only updates the application-specific role, does not affect the user's general role.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleInApp
 *             properties:
 *               roleInApp:
 *                 type: string
 *                 enum: [user, operations, manager, admin]
 *                 description: Role for user in this specific application
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: "ROLE_IN_APP_UPDATED" }
 *                     message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     roleInApp: { type: string }
 *                     userId: { type: integer }
 *                     applicationSlug: { type: string }
 *                     updatedAt: { type: string, format: date-time }
 *       404:
 *         description: User application access not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "USER_APP_ACCESS_NOT_FOUND" }
 *                 message: { type: string }
 *       422:
 *         description: Invalid role specified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "INVALID_ROLE_IN_APP" }
 *                 message: { type: string }
 *                 details:
 *                   type: object
 *                   properties:
 *                     reason: { type: string }
 *                     providedRole: { type: string }
 *                     validRoles: { type: array, items: { type: string } }
 *       403:
 *         description: Insufficient permissions (internal_admin required)
 */
router.put('/:id/users/:userId/applications/:appSlug/role', async (req, res) => {
  const tenantId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { appSlug } = req.params;
  const { roleInApp } = req.body;

  try {
    // Validate role
    const validRoles = ['user', 'operations', 'manager', 'admin'];
    if (!roleInApp || !validRoles.includes(roleInApp)) {
      return res.status(422).json({
        error: 'INVALID_ROLE_IN_APP',
        message: 'Invalid role specified for application access',
        details: {
          reason: 'INVALID_ROLE',
          providedRole: roleInApp,
          validRoles
        }
      });
    }

    await database.query('BEGIN');

    try {
      // Verify tenant exists
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          error: 'TENANT_NOT_FOUND',
          message: `Tenant with ID ${tenantId} not found`
        });
      }

      // Verify user exists and belongs to tenant
      const user = await User.findById(userId, tenantId);
      if (!user) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found in tenant ${tenantId}`
        });
      }

      // Verify application exists
      const application = await Application.findBySlug(appSlug);
      if (!application) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          error: 'APPLICATION_NOT_FOUND',
          message: `Application with slug '${appSlug}' not found`
        });
      }

      // Find existing user application access
      const access = await UserApplicationAccess.findByUserAndApp(userId, application.id, tenantId);
      if (!access) {
        await database.query('ROLLBACK');
        return res.status(404).json({
          error: 'USER_APP_ACCESS_NOT_FOUND',
          message: `User ${userId} does not have access to application ${appSlug} in tenant ${tenantId}`
        });
      }

      // Update the role_in_app field
      const updatedAccess = await access.updateRoleInApp(roleInApp);

      await database.query('COMMIT');

      console.log(`✅ [Platform] Role updated: user ${userId} role in ${appSlug} changed to ${roleInApp}`);

      res.json({
        success: true,
        meta: {
          code: 'ROLE_IN_APP_UPDATED',
          message: 'User role in application updated successfully'
        },
        data: {
          roleInApp: updatedAccess.roleInApp,
          userId,
          applicationSlug: appSlug,
          updatedAt: updatedAccess.updatedAt
        }
      });

    } catch (innerError) {
      await database.query('ROLLBACK');
      throw innerError;
    }

  } catch (error) {
    console.error('❌ [Platform] Error updating role in app:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role in application'
    });
  }
});

// =============================================================================
// TENANT-SCOPED USER MANAGEMENT ROUTES
// =============================================================================
// These routes are mounted under /tenants prefix in app.js

const bcrypt = require('bcrypt');

/**
 * @openapi
 * /tenants/{tenantId}/users:
 *   post:
 *     tags: [Users]
 *     summary: Create user in specific tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Create a new user directly assigned to a specific tenant (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [operations, manager, admin]
 *                 default: operations
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 default: active
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: USER_CREATED }
 *                     message: { type: string, example: User created successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         email: { type: string }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *                         name: { type: string }
 *                         role: { type: string }
 *                         status: { type: string }
 *                         tenantIdFk: { type: integer }
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: User already exists
 */
router.post('/:tenantId/users', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, password, firstName, lastName, role = 'operations', status = 'active' } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Email, password, firstName, and lastName are required'
        }
      });
    }

    if (!['operations', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Role must be one of: operations, manager, admin'
        }
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Get user type ID for the role
    const userTypeQuery = `SELECT id FROM user_types WHERE slug = $1`;
    const userTypeResult = await database.query(userTypeQuery, [role]);

    if (userTypeResult.rows.length === 0) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid role specified'
        }
      });
    }

    const userTypeId = userTypeResult.rows[0].id;

    const userData = {
      tenantIdFk: parseInt(tenantId),
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      status,
      userTypeId
    };

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      meta: {
        code: 'USER_CREATED',
        message: 'User created successfully'
      },
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Create tenant user error:', error);

    if (error.name === 'DuplicateUserError') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_USER',
          message: error.message
        }
      });
    }

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: {
          code: 400,
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to create user'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user in specific tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get a specific user by ID within a tenant context (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     email: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     name: { type: string }
 *                     role: { type: string }
 *                     status: { type: string }
 *                     tenantIdFk: { type: integer }
 *                     createdAt: { type: string }
 *                     updatedAt: { type: string }
 *                     lastLogin: { type: string }
 *       403:
 *         description: Insufficient permissions (internal_admin required)
 *       404:
 *         description: User not found in tenant
 */
router.get('/:tenantId/users/:userId', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;

    // Find user by ID and tenant
    const user = await User.findById(parseInt(userId), parseInt(tenantId));

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Get tenant user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found in specified tenant'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to get user'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: Update user in specific tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update user details within a specific tenant context (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               role:
 *                 type: string
 *                 enum: [operations, manager, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: USER_UPDATED }
 *                     message: { type: string, example: User updated successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found in tenant
 */
router.put('/:tenantId/users/:userId', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;
    const { firstName, lastName, role, status } = req.body;

    // Convert camelCase to snake_case for model
    const updates = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    // Find user by ID and tenant
    const user = await User.findById(parseInt(userId), parseInt(tenantId));

    // Update user
    await user.update(updates);

    res.json({
      success: true,
      meta: {
        code: 'USER_UPDATED',
        message: 'User updated successfully'
      },
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Update tenant user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found in specified tenant'
        }
      });
    }

    if (error.message.includes('validation') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: {
          code: 400,
          message: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to update user'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users/{userId}:
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate user in specific tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Soft delete (deactivate) a user within a specific tenant context (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: USER_DEACTIVATED }
 *                     message: { type: string, example: User deactivated successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { type: object }
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found in tenant
 */
router.delete('/:tenantId/users/:userId', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;

    // Find user by ID and tenant
    const user = await User.findById(parseInt(userId), parseInt(tenantId));

    // Soft delete user
    await user.update({ status: 'inactive' });

    res.json({
      success: true,
      meta: {
        code: 'USER_DEACTIVATED',
        message: 'User deactivated successfully'
      },
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Delete tenant user error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found in specified tenant'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to deactivate user'
      }
    });
  }
});

/**
 * @openapi
 * /tenants/{tenantId}/users/{userId}/reset-password:
 *   post:
 *     tags: [Users]
 *     summary: Reset user password in specific tenant
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Reset a user's password within a specific tenant context (internal admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID (numeric)
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: newPassword123
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string, example: PASSWORD_RESET }
 *                     message: { type: string, example: Password reset successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId: { type: integer }
 *                     resetBy: { type: string }
 *                     resetAt: { type: string }
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found in tenant
 */
router.post('/:tenantId/users/:userId/reset-password', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Password is required'
        }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Password must be at least 6 characters long'
        }
      });
    }

    // Find user by ID and tenant
    const user = await User.findById(parseInt(userId), parseInt(tenantId));

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    await user.update({ passwordHash });

    res.json({
      success: true,
      meta: {
        code: 'PASSWORD_RESET',
        message: 'Password reset successfully'
      },
      data: {
        userId: parseInt(userId),
        resetBy: req.user?.email || 'admin',
        resetAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Reset tenant user password error:', error);

    if (error.name === 'UserNotFoundError') {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found in specified tenant'
        }
      });
    }

    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to reset password'
      }
    });
  }
});

module.exports = router;

