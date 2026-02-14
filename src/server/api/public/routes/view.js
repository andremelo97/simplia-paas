const express = require('express');
const { createRateLimit } = require('../../../infra/middleware/auth');
const { LandingPage, LandingPageNotFoundError } = require('../../../infra/models/LandingPage');
const { Quote } = require('../../../infra/models/Quote');
const { TenantBranding } = require('../../../infra/models/TenantBranding');
const database = require('../../../infra/db/database');

const router = express.Router();

// Stricter rate limit for public access (no authentication)
const publicRateLimit = createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes
router.use(publicRateLimit);

/**
 * @openapi
 * /public/quotes/{tenantSlug}/{token}:
 *   get:
 *     tags: [Public - Quotes]
 *     summary: View public quote (NO AUTHENTICATION REQUIRED)
 *     description: |
 *       **Public Endpoint** - No authentication required
 *
 *       Displays a quote via public shareable link.
 *       Supports optional password protection.
 *     parameters:
 *       - in: path
 *         name: tenantSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant subdomain/slug
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Access token (32-char URL-safe string)
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         description: Password (if quote is password-protected)
 *     responses:
 *       200:
 *         description: Quote data with branding and Puck schema
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
 *                     branding:
 *                       type: object
 *                     puckSchema:
 *                       type: object
 *                     viewsCount:
 *                       type: integer
 *       401:
 *         description: Password required or invalid password
 *       403:
 *         description: Quote link has expired
 *       404:
 *         description: Tenant or quote not found
 */
router.get('/quotes/:tenantSlug/:token', async (req, res) => {
  try {
    const { tenantSlug, token } = req.params;
    const { password } = req.query;

    // 1. Resolve tenant from slug
    const tenantQuery = 'SELECT id, schema_name, subdomain FROM tenants WHERE subdomain = $1 AND active = true';
    const tenantResult = await database.query(tenantQuery, [tenantSlug]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];
    const schema = tenant.schema_name;

    // 2. Find landing page by token with full quote data
    let landingPage;
    try {
      landingPage = await LandingPage.findByTokenWithDocumentData(token, schema);
    } catch (error) {
      if (error instanceof LandingPageNotFoundError) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote link not found or has been revoked'
        });
      }
      throw error;
    }

    // 3. Check if link is expired
    if (landingPage.isExpired()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Quote link has expired',
        expiresAt: landingPage.expiresAt
      });
    }

    // 4. Verify password if required
    if (landingPage.passwordHash && !password) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Password required',
        requiresPassword: true
      });
    }

    if (landingPage.passwordHash) {
      const isValidPassword = await landingPage.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid password',
          requiresPassword: true
        });
      }
    }

    // 5. Increment view count (async, don't wait)
    landingPage.incrementViews(schema).catch(err => {
      console.error('Error incrementing views:', err);
    });

    // 6. Get full quote with items (only for quote document type)
    let quote = null;
    if (landingPage.documentType === 'quote' && landingPage.documentId) {
      quote = await Quote.findById(landingPage.documentId, schema, true, true);
    }

    // 7. Get tenant branding (with signed URLs for private bucket)
    const branding = await TenantBranding.findByTenant(tenant.id);

    // 8. Return combined data
    res.json({
      data: {
        quote: quote ? quote.toJSON() : null,
        branding: await branding.toJSONWithSignedUrls(tenant.subdomain),
        puckSchema: landingPage.content,
        viewsCount: landingPage.viewsCount
      }
    });
  } catch (error) {
    console.error('View public quote error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to load quote'
    });
  }
});

/**
 * @openapi
 * /public/quotes/{tenantSlug}/{token}/verify-password:
 *   post:
 *     tags: [Public - Quotes]
 *     summary: Verify password for protected quote
 *     description: |
 *       **Public Endpoint** - No authentication required
 *
 *       Verifies if a password is correct for a password-protected quote.
 *       Useful for frontend to validate password before showing content.
 *     parameters:
 *       - in: path
 *         name: tenantSlug
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Password is valid
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Quote not found
 */
router.post('/quotes/:tenantSlug/:token/verify-password', async (req, res) => {
  try {
    const { tenantSlug, token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required'
      });
    }

    // Resolve tenant
    const tenantQuery = 'SELECT schema_name FROM tenants WHERE subdomain = $1 AND active = true';
    const tenantResult = await database.query(tenantQuery, [tenantSlug]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found'
      });
    }

    const schema = tenantResult.rows[0].schema_name;

    // Find landing page
    let landingPage;
    try {
      landingPage = await LandingPage.findByToken(token, schema);
    } catch (error) {
      if (error instanceof LandingPageNotFoundError) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Quote link not found'
        });
      }
      throw error;
    }

    // Verify password
    const isValid = await landingPage.verifyPassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password',
        valid: false
      });
    }

    res.json({
      valid: true,
      message: 'Password is valid'
    });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify password'
    });
  }
});

module.exports = router;
