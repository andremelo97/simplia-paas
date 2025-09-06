const express = require('express');
const { requireAuth, requireAdmin } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const { requireAnyAppAccess } = require('../../../infra/middleware/appAccess');
const { Application, ApplicationNotFoundError } = require('../../../infra/models/Application');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const { UserApplicationAccess } = require('../../../infra/models/UserApplicationAccess');
const ApplicationPricing = require('../../../infra/models/ApplicationPricing');

const router = express.Router();

// All applications routes require authentication and internal admin platform role
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /applications:
 *   get:
 *     tags: [Applications - Platform]
 *     summary: List application catalog
 *     description: Get all applications in the system with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deprecated, trial]
 *           default: active
 *         description: Filter by application status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of applications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of applications to skip
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     applications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           slug: { type: string }
 *                           description: { type: string }
 *                           status: { type: string }
 *                           pricePerUser: { type: number }
 *                           version: { type: string }
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
    const { status = 'active', limit = 50, offset = 0 } = req.query;
    
    const applications = await Application.findAll({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Application.count(status);
    
    res.json({
      success: true,
      data: {
        applications: applications.map(app => app.toJSON()),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + applications.length < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch applications'
      }
    });
  }
});

/**
 * @openapi
 * /applications/{id}:
 *   get:
 *     tags: [Applications - Platform]
 *     summary: Get application by ID
 *     description: Get specific application details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application retrieved successfully
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
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     description: { type: string }
 *                     status: { type: string }
 *                     pricePerUser: { type: number }
 *                     version: { type: string }
 *                     createdAt: { type: string }
 *                     updatedAt: { type: string }
 *       404:
 *         description: Application not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(parseInt(id));
    
    res.json({
      success: true,
      data: application.toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }
    
    console.error('Error fetching application:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch application'
      }
    });
  }
});

/**
 * @openapi
 * /applications/slug/{slug}:
 *   get:
 *     tags: [Applications - Platform]
 *     summary: Get application by slug
 *     description: Get specific application details by slug identifier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Application slug (e.g., tq, pm, billing, reports)
 *     responses:
 *       200:
 *         description: Application retrieved successfully
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
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     description: { type: string }
 *                     status: { type: string }
 *                     pricePerUser: { type: number }
 *                     version: { type: string }
 *                     createdAt: { type: string }
 *                     updatedAt: { type: string }
 *       404:
 *         description: Application not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const application = await Application.findBySlug(slug);
    
    res.json({
      success: true,
      data: application.toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }
    
    console.error('Error fetching application:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch application'
      }
    });
  }
});

/**
 * GET /api/applications/tenant/licensed
 * Get applications licensed to current tenant
 */
router.get('/tenant/licensed', requireAuth, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status = 'active', limit = 50, offset = 0 } = req.query;
    
    const licensedApps = await Application.findByTenant(tenantId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      applications: licensedApps.map(app => app.toJSON()),
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
 * GET /api/applications/user/accessible
 * Get applications current user has access to
 */
router.get('/user/accessible', requireAuth, requireAnyAppAccess, async (req, res) => {
  try {
    const { allowedApps } = req.user;
    
    // If we have allowedApps from JWT, use that
    if (allowedApps && allowedApps.length > 0) {
      return res.json({
        applications: allowedApps,
        source: 'jwt'
      });
    }
    
    // Otherwise get from database
    const { userId, tenantId } = req.user;
    const userApps = await UserApplicationAccess.getUserAllowedApps(userId, tenantId);
    
    res.json({
      applications: userApps,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user applications'
    });
  }
});

// Note: Platform role already enforced globally for this router

/**
 * @openapi
 * /applications:
 *   post:
 *     tags: [Applications - Platform]
 *     summary: Create new application
 *     description: Create a new application in the system catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Transcription Quote"
 *                 description: Human-readable application name
 *               slug:
 *                 type: string
 *                 pattern: "^[a-z]+$"
 *                 minLength: 2
 *                 maxLength: 10
 *                 example: "tq"
 *                 description: Unique application identifier (lowercase letters only)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "AI-powered transcription and quote generation system"
 *                 description: Detailed application description
 *               pricePerUser:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 10000
 *                 example: 29.99
 *                 description: Monthly price per user in USD
 *               version:
 *                 type: string
 *                 pattern: "^\\d+\\.\\d+\\.\\d+$"
 *                 example: "1.0.0"
 *                 default: "1.0.0"
 *                 description: Application version (semantic versioning)
 *           examples:
 *             transcription_app:
 *               summary: Transcription application
 *               value:
 *                 name: "Transcription Quote"
 *                 slug: "tq"
 *                 description: "AI-powered transcription and quote generation system"
 *                 pricePerUser: 29.99
 *                 version: "1.0.0"
 *             project_management:
 *               summary: Project management application
 *               value:
 *                 name: "Project Manager"
 *                 slug: "pm"
 *                 description: "Advanced project management and collaboration tools"
 *                 pricePerUser: 49.99
 *                 version: "2.1.0"
 *             billing_system:
 *               summary: Billing application
 *               value:
 *                 name: "Billing & Invoicing"
 *                 slug: "billing"
 *                 description: "Comprehensive billing and financial management system"
 *                 pricePerUser: 19.99
 *     responses:
 *       201:
 *         description: Application created successfully
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
 *                     id: { type: integer }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     description: { type: string }
 *                     status: { type: string }
 *                     pricePerUser: { type: number }
 *                     version: { type: string }
 *                     createdAt: { type: string }
 *                     updatedAt: { type: string }
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Application with this slug already exists
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, pricePerUser, version = '1.0.0' } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Name and slug are required'
        }
      });
    }
    
    const application = await Application.create({
      name,
      slug,
      description,
      pricePerUser: parseFloat(pricePerUser || 0),
      version
    });
    
    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: application.toJSON()
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: {
          code: 409,
          message: error.message
        }
      });
    }
    
    console.error('Error creating application:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to create application'
      }
    });
  }
});

/**
 * PUT /api/applications/:id
 * Update application (admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const application = await Application.findById(parseInt(id));
    await application.update(updates);
    
    res.json(application.toJSON());
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error updating application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update application'
    });
  }
});

/**
 * DELETE /api/applications/:id
 * Soft delete application by setting status to 'deprecated' (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findById(parseInt(id));
    await application.update({ status: 'deprecated' });
    
    res.json({
      message: 'Application deprecated successfully',
      application: application.toJSON()
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error deprecating application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to deprecate application'
    });
  }
});

/**
 * @openapi
 * /applications/{id}/tenants:
 *   get:
 *     tags: [Applications - Platform]
 *     summary: List licensed tenants for application
 *     description: Get all tenants that have licenses for a specific application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, suspended]
 *           default: active
 *         description: Filter by license status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of tenant licenses to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of tenant licenses to skip
 *     responses:
 *       200:
 *         description: Licensed tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     applicationId: { type: integer }
 *                     tenantLicenses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           tenantId: { type: string }
 *                           tenantName: { type: string }
 *                           status: { type: string }
 *                           activatedAt: { type: string }
 *                           expiresAt: { type: string }
 *                           userLimit: { type: integer }
 *                           seatsUsed: { type: integer }
 *                           currentUserCount: { type: integer }
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
 *         description: Application not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/:id/tenants', async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active', limit = 50, offset = 0 } = req.query;
    
    // Verify application exists
    const application = await Application.findById(parseInt(id));
    
    // Get all tenant licenses for this application
    const query = `
      SELECT ta.*, t.name as tenant_name, COUNT(uaa.id) as user_count
      FROM public.tenant_applications ta
      LEFT JOIN public.tenants t ON ta.tenant_id_fk = t.id
      LEFT JOIN public.user_application_access uaa ON (ta.application_id = uaa.application_id AND ta.tenant_id_fk = uaa.tenant_id_fk AND uaa.active = true)
      WHERE ta.application_id = $1 AND ta.status = $2 AND ta.active = true
      GROUP BY ta.id, t.name
      ORDER BY ta.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const database = require('../../../infra/db/database');
    const result = await database.query(query, [
      parseInt(id), 
      status, 
      parseInt(limit), 
      parseInt(offset)
    ]);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.tenant_applications ta
      WHERE ta.application_id = $1 AND ta.status = $2 AND ta.active = true
    `;
    const countResult = await database.query(countQuery, [parseInt(id), status]);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: {
        applicationId: parseInt(id),
        applicationName: application.name,
        tenantLicenses: result.rows.map(row => ({
          id: row.id,
          tenantId: row.tenant_id_fk,
          tenantName: row.tenant_name,
          status: row.status,
          activatedAt: row.created_at,
          expiresAt: row.expiry_date,
          userLimit: row.user_limit,
          seatsUsed: row.seats_used,
          currentUserCount: parseInt(row.user_count),
          createdAt: row.created_at,
          updatedAt: row.updated_at
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
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: {
          code: 404,
          message: error.message
        }
      });
    }
    
    console.error('Error fetching application tenants:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch application tenants'
      }
    });
  }
});

// =============================================
// APPLICATION PRICING ENDPOINTS
// =============================================

/**
 * @openapi
 * /applications/{id}/pricing:
 *   get:
 *     tags: [Applications - Platform]
 *     summary: Get application pricing matrix
 *     description: Get pricing for all user types for a specific application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *       - in: query
 *         name: current
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only current pricing (true) or full history (false)
 *     responses:
 *       200:
 *         description: Pricing matrix retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     applicationId: { type: integer }
 *                     pricing:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           userTypeId: { type: integer }
 *                           userTypeName: { type: string }
 *                           userTypeSlug: { type: string }
 *                           price: { type: number }
 *                           currency: { type: string }
 *                           billingCycle: { type: string }
 *                           validFrom: { type: string }
 *                           validTo: { type: string }
 *       404:
 *         description: Application not found
 */
router.get('/:id/pricing', async (req, res) => {
  try {
    const { id } = req.params;
    const { current = 'true' } = req.query;
    const applicationId = parseInt(id);

    // Verify application exists
    const app = await Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    const pricing = await ApplicationPricing.getByApplication(
      applicationId, 
      current !== 'false' // Only false if explicitly set to 'false'
    );

    res.json({
      success: true,
      data: {
        applicationId,
        pricing: pricing
      }
    });
  } catch (error) {
    console.error('Error fetching application pricing:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch pricing matrix'
    });
  }
});

/**
 * @openapi
 * /applications/{id}/pricing:
 *   post:
 *     tags: [Applications - Platform]
 *     summary: Create or schedule application pricing
 *     description: Create new pricing for application and user type combination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userTypeId, price]
 *             properties:
 *               userTypeId:
 *                 type: integer
 *                 example: 1
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 49.90
 *               currency:
 *                 type: string
 *                 enum: [BRL, USD, EUR]
 *                 default: BRL
 *                 example: "BRL"
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *                 example: "monthly"
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: "When this price becomes effective, defaults to now"
 *                 example: "2025-01-01T00:00:00Z"
 *               validTo:
 *                 type: string
 *                 format: date-time
 *                 description: When this price expires - optional
 *                 example: "2025-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Pricing created successfully
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
 *                     pricing: { type: object }
 *       400:
 *         description: Validation error
 *       404:
 *         description: Application not found
 */
router.post('/:id/pricing', async (req, res) => {
  try {
    const { id } = req.params;
    const { userTypeId, price, currency, billingCycle, validFrom, validTo } = req.body;
    const applicationId = parseInt(id);

    // Verify application exists
    const app = await Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // Determine if this is immediate or scheduled pricing
    const effectiveDate = validFrom ? new Date(validFrom) : new Date();
    const isScheduled = effectiveDate > new Date();

    let pricing;
    if (isScheduled) {
      // Use schedule method for future pricing
      pricing = await ApplicationPricing.schedulePrice(
        applicationId,
        userTypeId,
        price,
        effectiveDate,
        { currency, billingCycle, validTo: validTo ? new Date(validTo) : null }
      );
    } else {
      // Create immediate pricing
      pricing = await ApplicationPricing.create({
        applicationId,
        userTypeId,
        price,
        currency,
        billingCycle,
        validFrom: effectiveDate,
        validTo: validTo ? new Date(validTo) : null
      });
    }

    res.status(201).json({
      meta: {
        code: "PRICING_CREATED",
        message: isScheduled ? "Pricing scheduled successfully." : "Pricing created successfully."
      },
      data: {
        pricing: pricing.toJSON()
      }
    });
  } catch (error) {
    console.error('Error creating application pricing:', error);

    // Handle structured overlap errors (422)
    if (error.code === 'PRICING_OVERLAP' && error.status === 422) {
      return res.status(422).json({
        error: 'Semantic Error',
        code: error.code,
        message: error.message,
        details: error.details
      });
    }

    if (error.message.includes('required') || 
        error.message.includes('negative') ||
        error.message.includes('monthly or yearly')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error.message.includes('duplicate') || 
        error.message.includes('unique')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Pricing for this combination already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create pricing'
    });
  }
});

/**
 * @openapi
 * /applications/{id}/pricing/{pricingId}:
 *   put:
 *     tags: [Applications - Platform]
 *     summary: Update application pricing
 *     description: Update existing pricing entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pricing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 minimum: 0
 *               currency:
 *                 type: string
 *                 enum: [BRL, USD, EUR]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               validTo:
 *                 type: string
 *                 format: date-time
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Application or pricing not found
 */
router.put('/:id/pricing/:pricingId', async (req, res) => {
  try {
    const { id, pricingId } = req.params;
    const applicationId = parseInt(id);
    const pricingIdInt = parseInt(pricingId);

    // Verify application exists
    const app = await Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    const pricing = await ApplicationPricing.update(pricingIdInt, req.body);
    
    if (!pricing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pricing entry not found'
      });
    }

    res.json({
      meta: {
        code: "PRICING_UPDATED",
        message: "Pricing updated successfully."
      },
      data: {
        pricing: pricing.toJSON()
      }
    });
  } catch (error) {
    console.error('Error updating application pricing:', error);

    // Handle structured overlap errors (422)
    if (error.code === 'PRICING_OVERLAP' && error.status === 422) {
      return res.status(422).json({
        error: 'Semantic Error',
        code: error.code,
        message: error.message,
        details: error.details
      });
    }

    if (error.message.includes('negative') ||
        error.message.includes('monthly or yearly') ||
        error.message.includes('No valid fields')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update pricing'
    });
  }
});

/**
 * @openapi
 * /applications/{id}/pricing/{pricingId}/end:
 *   post:
 *     tags: [Applications - Platform]
 *     summary: End pricing period
 *     description: End an active pricing period by setting validTo to current timestamp and active to false
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pricing entry ID
 *     responses:
 *       200:
 *         description: Pricing period ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: 
 *                       type: string
 *                       example: PRICING_ENDED
 *                     message:
 *                       type: string
 *                       example: Pricing period ended successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         applicationId: { type: integer }
 *                         userTypeId: { type: integer }
 *                         price: { type: number }
 *                         currency: { type: string }
 *                         billingCycle: { type: string }
 *                         validFrom: { type: string, format: date-time }
 *                         validTo: { type: string, format: date-time }
 *                         active: { type: boolean, example: false }
 *                         createdAt: { type: string, format: date-time }
 *                         updatedAt: { type: string, format: date-time }
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 *       404:
 *         description: Application or pricing entry not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/pricing/:pricingId/end', async (req, res) => {
  try {
    const { id, pricingId } = req.params;
    const applicationId = parseInt(id);
    const pricingIdInt = parseInt(pricingId);

    // Verify application exists
    const app = await Application.findById(applicationId);
    if (!app) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // End the pricing period by setting validTo to now and active to false
    const now = new Date();
    const pricing = await ApplicationPricing.update(pricingIdInt, {
      validTo: now,
      active: false
    });
    
    if (!pricing) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pricing entry not found'
      });
    }

    res.json({
      meta: {
        code: "PRICING_ENDED",
        message: "Pricing period ended successfully."
      },
      data: {
        pricing: pricing.toJSON()
      }
    });
  } catch (error) {
    console.error('Error ending application pricing:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to end pricing period'
    });
  }
});

module.exports = router;