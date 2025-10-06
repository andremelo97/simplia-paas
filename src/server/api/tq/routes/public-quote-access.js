const express = require('express');
const database = require('../../../infra/db/database');
const { PublicQuote } = require('../../../infra/models/PublicQuote');

const router = express.Router();

/**
 * @openapi
 * /pq/{accessToken}:
 *   post:
 *     tags: [TQ - Public Quote Access]
 *     summary: Access public quote with password
 *     description: |
 *       **Public endpoint** - No authentication required.
 *       
 *       ALWAYS requires password to access public quote.
 *       Returns full quote data with template for rendering.
 *     parameters:
 *       - in: path
 *         name: accessToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Public quote access token (64 chars hex)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password to access the quote
 *     responses:
 *       200:
 *         description: Password verified, returns full quote data with template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     quote:
 *                       type: object
 *                     patient:
 *                       type: object
 *                     template:
 *                       type: object
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Quote not found or expired
 */
router.post('/pq/:accessToken', async (req, res) => {
  try {
    const { accessToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required'
      });
    }

    // Find tenant_id and schema for this access token
    const tenantsQuery = `
      SELECT id, schema_name 
      FROM public.tenants 
      WHERE status = 'active'
    `;
    const tenantsResult = await database.query(tenantsQuery);

    let tenantSchema = null;
    let tenantId = null;

    // Search in each tenant schema for the access_token
    for (const tenant of tenantsResult.rows) {
      try {
        const query = `
          SELECT tenant_id 
          FROM ${tenant.schema_name}.public_quote 
          WHERE access_token = $1 AND active = true
          LIMIT 1
        `;
        const result = await database.query(query, [accessToken]);
        
        if (result.rows.length > 0) {
          tenantSchema = tenant.schema_name;
          tenantId = result.rows[0].tenant_id;
          break;
        }
      } catch (error) {
        // Schema might not have public_quote table yet, continue
        continue;
      }
    }

    if (!tenantSchema) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quote not found or has expired'
      });
    }

    // Get public quote with password hash
    const publicQuote = await PublicQuote.findByToken(accessToken, tenantSchema);

    // Check if expired
    if (publicQuote.isExpired()) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'This quote link has expired'
      });
    }

    // Verify password
    const isValid = await publicQuote.verifyPassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password'
      });
    }

    // Get the saved content package (template + resolved data)
    const contentQuery = `
      SELECT pq.content
      FROM ${tenantSchema}.public_quote pq
      WHERE pq.access_token = $1
      LIMIT 1
    `;

    const contentResult = await database.query(contentQuery, [accessToken]);
    
    if (contentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Quote data not found'
      });
    }

    const contentPackage = contentResult.rows[0].content;
    
    // Get branding from global tenant_branding table
    const brandingQuery = `
      SELECT primary_color, secondary_color, tertiary_color, logo_url, background_video_url
      FROM public.tenant_branding
      WHERE tenant_id_fk = $1
      LIMIT 1
    `;
    
    const brandingResult = await database.query(brandingQuery, [tenantId]);
    const brandingData = brandingResult.rows[0] || {};

    // Increment view count
    await publicQuote.incrementViews(tenantSchema);

    // Return the saved content package + branding
    // Content package already has template and resolvedData
    res.json({
      data: {
        content: contentPackage, // Contains { template, resolvedData }
        branding: {
          primaryColor: brandingData.primary_color || '#3B82F6',
          secondaryColor: brandingData.secondary_color || '#1E40AF',
          tertiaryColor: brandingData.tertiary_color || '#60A5FA',
          logo: brandingData.logo_url || null,
          backgroundVideoUrl: brandingData.background_video_url || null
        }
      }
    });

  } catch (error) {
    console.error('Public quote access error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to access public quote'
    });
  }
});

module.exports = router;

