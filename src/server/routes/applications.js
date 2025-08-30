const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { requireAnyAppAccess } = require('../middleware/appAccess');
const { Application, ApplicationNotFoundError } = require('../models/Application');
const { TenantApplication } = require('../models/TenantApplication');
const { UserApplicationAccess } = require('../models/UserApplicationAccess');

const router = express.Router();

/**
 * GET /api/applications
 * Get all available applications (public catalog)
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
      applications: applications.map(app => app.toJSON()),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + applications.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch applications'
    });
  }
});

/**
 * GET /api/applications/:id
 * Get specific application by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(parseInt(id));
    
    res.json(application.toJSON());
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error fetching application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch application'
    });
  }
});

/**
 * GET /api/applications/slug/:slug
 * Get specific application by slug
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const application = await Application.findBySlug(slug);
    
    res.json(application.toJSON());
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error fetching application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch application'
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

// Admin-only routes below this point
router.use(requireAuth, requireAdmin);

/**
 * POST /api/applications
 * Create new application (admin only)
 */
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, pricePerUser, version = '1.0.0' } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name and slug are required'
      });
    }
    
    const application = await Application.create({
      name,
      slug,
      description,
      pricePerUser: parseFloat(pricePerUser || 0),
      version
    });
    
    res.status(201).json(application.toJSON());
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    
    console.error('Error creating application:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create application'
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
 * GET /api/applications/:id/tenants
 * Get all tenants licensed for specific application (admin only)
 */
router.get('/:id/tenants', async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active', limit = 50, offset = 0 } = req.query;
    
    // Verify application exists
    await Application.findById(parseInt(id));
    
    // Get all tenant licenses for this application
    const query = `
      SELECT ta.*, COUNT(uaa.id) as user_count
      FROM public.tenant_applications ta
      LEFT JOIN public.user_application_access uaa ON (ta.application_id = uaa.application_id AND ta.tenant_id = uaa.tenant_id AND uaa.is_active = true)
      WHERE ta.application_id = $1 AND ta.status = $2
      GROUP BY ta.id
      ORDER BY ta.activated_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const database = require('../config/database');
    const result = await database.query(query, [
      parseInt(id), 
      status, 
      parseInt(limit), 
      parseInt(offset)
    ]);
    
    res.json({
      tenantLicenses: result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        status: row.status,
        activatedAt: row.activated_at,
        expiresAt: row.expires_at,
        maxUsers: row.max_users,
        currentUserCount: parseInt(row.user_count),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    if (error instanceof ApplicationNotFoundError) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    console.error('Error fetching application tenants:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch application tenants'
    });
  }
});

module.exports = router;