const express = require('express');
const { requireAuth, requireAdmin } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const { Application, ApplicationNotFoundError } = require('../../../infra/models/Application');
const { TenantApplication } = require('../../../infra/models/TenantApplication');
const ApplicationPricing = require('../../../infra/models/ApplicationPricing');

const router = express.Router();

// All applications routes require authentication and internal admin platform role
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /applications:
 *   get:
 *     tags: [Applications]
 *     summary: List application catalog
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get all applications in the system with filtering and pagination
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
 *     tags: [Applications]
 *     summary: Get application by ID
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get specific application details by ID
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
 *     tags: [Applications]
 *     summary: Get application by slug
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get specific application details by slug identifier
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



// Note: Platform role already enforced globally for this router





// =============================================
// APPLICATION PRICING ENDPOINTS
// =============================================

/**
 * @openapi
 * /applications/{id}/pricing:
 *   get:
 *     tags: [Applications]
 *     summary: Get application pricing matrix
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Get pricing for all user types for a specific application
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
 *     tags: [Applications]
 *     summary: Create or schedule application pricing
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Create new pricing for application and user type combination
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
 *     tags: [Applications]
 *     summary: Update application pricing
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Update existing pricing entry
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
 *     tags: [Applications]
 *     summary: End pricing period
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       End an active pricing period by setting validTo to current timestamp and active to false
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