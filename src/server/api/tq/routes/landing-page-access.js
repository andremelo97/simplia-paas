const express = require('express');
const database = require('../../../infra/db/database');
const { LandingPage } = require('../../../infra/models/LandingPage');
const { Quote } = require('../../../infra/models/Quote');
const { Prevention } = require('../../../infra/models/Prevention');

const router = express.Router();

/**
 * @openapi
 * /lp/{accessToken}:
 *   post:
 *     tags: [TQ - Landing Page Access]
 *     summary: Access landing page with password
 *     description: |
 *       **Public endpoint** - No authentication required.
 *
 *       ALWAYS requires password to access landing page.
 *       Returns full document data with template for rendering.
 *     parameters:
 *       - in: path
 *         name: accessToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Landing page access token (64 chars hex)
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
 *                 description: Password to access the landing page
 *     responses:
 *       200:
 *         description: Password verified, returns full document data with template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: object
 *                     branding:
 *                       type: object
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Landing page not found or expired
 */
router.post('/lp/:accessToken', async (req, res) => {
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
          FROM ${tenant.schema_name}.landing_page
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
        // Schema might not have landing_page table yet, continue
        continue;
      }
    }

    if (!tenantSchema) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Landing page not found or has expired'
      });
    }

    // Get landing page with password hash
    const landingPage = await LandingPage.findByToken(accessToken, tenantSchema);

    // Check if expired
    if (landingPage.isExpired()) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'This landing page link has expired'
      });
    }

    // Verify password
    const isValid = await landingPage.verifyPassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password'
      });
    }

    // Get the saved content package (template + resolved data)
    const contentQuery = `
      SELECT lp.content
      FROM ${tenantSchema}.landing_page lp
      WHERE lp.access_token = $1
      LIMIT 1
    `;

    const contentResult = await database.query(contentQuery, [accessToken]);

    if (contentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Landing page data not found'
      });
    }

    const contentPackage = contentResult.rows[0].content;

    // Get branding from global tenant_branding table (including social links and contact info)
    const brandingQuery = `
      SELECT primary_color, secondary_color, tertiary_color, logo_url,
             social_links, email, phone, address, company_name
      FROM public.tenant_branding
      WHERE tenant_id_fk = $1
      LIMIT 1
    `;

    const brandingResult = await database.query(brandingQuery, [tenantId]);
    const brandingData = brandingResult.rows[0] || {};

    // Increment view count
    await landingPage.incrementViews(tenantSchema);

    // Return the saved content package + branding
    res.json({
      data: {
        content: contentPackage,
        branding: {
          primaryColor: brandingData.primary_color || '#3B82F6',
          secondaryColor: brandingData.secondary_color || '#1E40AF',
          tertiaryColor: brandingData.tertiary_color || '#60A5FA',
          logo: brandingData.logo_url || null,
          socialLinks: brandingData.social_links || null,
          email: brandingData.email || null,
          phone: brandingData.phone || null,
          address: brandingData.address || null,
          companyName: brandingData.company_name || null
        }
      }
    });

  } catch (error) {
    console.error('Landing page access error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to access landing page'
    });
  }
});

/**
 * @openapi
 * /lp/{accessToken}/approve:
 *   patch:
 *     tags: [TQ - Landing Page Access]
 *     summary: Approve quote via landing page link
 *     description: |
 *       **Public endpoint** - No authentication required.
 *
 *       Approves the quote associated with this landing page link.
 *       Only works for document_type = 'quote'.
 *       Requires password verification.
 *     parameters:
 *       - in: path
 *         name: accessToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Landing page access token (64 chars hex)
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
 *                 description: Password to access the landing page
 *     responses:
 *       200:
 *         description: Quote approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     approved:
 *                       type: boolean
 *                     quoteNumber:
 *                       type: string
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Landing page not found or expired
 *       409:
 *         description: Quote already approved or in invalid state
 */
router.patch('/lp/:accessToken/approve', async (req, res) => {
  try {
    const { accessToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required'
      });
    }

    // Find tenant schema for this access token
    const tenantsQuery = `
      SELECT id, schema_name
      FROM public.tenants
      WHERE status = 'active'
    `;
    const tenantsResult = await database.query(tenantsQuery);

    let tenantSchema = null;
    let documentId = null;
    let documentType = null;

    // Search in each tenant schema for the access_token
    for (const tenant of tenantsResult.rows) {
      try {
        const query = `
          SELECT lp.document_id, lp.document_type
          FROM ${tenant.schema_name}.landing_page lp
          WHERE lp.access_token = $1 AND lp.active = true
          LIMIT 1
        `;
        const result = await database.query(query, [accessToken]);

        if (result.rows.length > 0) {
          tenantSchema = tenant.schema_name;
          documentId = result.rows[0].document_id;
          documentType = result.rows[0].document_type;
          break;
        }
      } catch (error) {
        // Schema might not have landing_page table yet, continue
        continue;
      }
    }

    if (!tenantSchema || !documentId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Landing page not found or has expired'
      });
    }

    // Only quotes can be approved
    if (documentType !== 'quote') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only quotes can be approved via landing page'
      });
    }

    // Get landing page with password hash
    const landingPage = await LandingPage.findByToken(accessToken, tenantSchema);

    // Check if expired
    if (landingPage.isExpired()) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'This landing page link has expired'
      });
    }

    // Verify password
    const isValid = await landingPage.verifyPassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password'
      });
    }

    // Get current quote status
    const quote = await Quote.findById(documentId, tenantSchema);

    // Check if quote can be approved (only draft or sent can be approved)
    if (quote.status === 'approved') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This quote has already been approved'
      });
    }

    if (quote.status === 'rejected' || quote.status === 'expired') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This quote cannot be approved in its current state'
      });
    }

    // Update quote status to approved
    await Quote.update(documentId, { status: 'approved' }, tenantSchema);

    res.json({
      data: {
        approved: true,
        quoteNumber: quote.number
      },
      meta: {
        code: 'QUOTE_APPROVED_BY_CLIENT'
      }
    });

  } catch (error) {
    console.error('Landing page approve error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to approve quote'
    });
  }
});

/**
 * @openapi
 * /lp/{accessToken}/mark-viewed:
 *   patch:
 *     tags: [TQ - Landing Page Access]
 *     summary: Mark prevention as viewed via landing page link
 *     description: |
 *       **Public endpoint** - No authentication required.
 *
 *       Marks the prevention document as viewed.
 *       Only works for document_type = 'prevention'.
 *       Requires password verification.
 *     parameters:
 *       - in: path
 *         name: accessToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Landing page access token (64 chars hex)
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
 *                 description: Password to access the landing page
 *     responses:
 *       200:
 *         description: Prevention marked as viewed
 *       401:
 *         description: Invalid password
 *       404:
 *         description: Landing page not found or expired
 */
router.patch('/lp/:accessToken/mark-viewed', async (req, res) => {
  try {
    const { accessToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required'
      });
    }

    // Find tenant schema for this access token
    const tenantsQuery = `
      SELECT id, schema_name
      FROM public.tenants
      WHERE status = 'active'
    `;
    const tenantsResult = await database.query(tenantsQuery);

    let tenantSchema = null;
    let documentId = null;
    let documentType = null;

    // Search in each tenant schema for the access_token
    for (const tenant of tenantsResult.rows) {
      try {
        const query = `
          SELECT lp.document_id, lp.document_type
          FROM ${tenant.schema_name}.landing_page lp
          WHERE lp.access_token = $1 AND lp.active = true
          LIMIT 1
        `;
        const result = await database.query(query, [accessToken]);

        if (result.rows.length > 0) {
          tenantSchema = tenant.schema_name;
          documentId = result.rows[0].document_id;
          documentType = result.rows[0].document_type;
          break;
        }
      } catch (error) {
        // Schema might not have landing_page table yet, continue
        continue;
      }
    }

    if (!tenantSchema || !documentId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Landing page not found or has expired'
      });
    }

    // Only prevention documents can be marked as viewed
    if (documentType !== 'prevention') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only prevention documents can be marked as viewed'
      });
    }

    // Get landing page with password hash
    const landingPage = await LandingPage.findByToken(accessToken, tenantSchema);

    // Check if expired
    if (landingPage.isExpired()) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'This landing page link has expired'
      });
    }

    // Verify password
    const isValid = await landingPage.verifyPassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password'
      });
    }

    // Get current prevention
    const prevention = await Prevention.findById(documentId, tenantSchema);

    // Update prevention status to viewed (if not already)
    if (prevention.status !== 'viewed') {
      await Prevention.update(documentId, { status: 'viewed' }, tenantSchema);
    }

    res.json({
      data: {
        viewed: true,
        preventionNumber: prevention.number
      },
      meta: {
        code: 'PREVENTION_MARKED_VIEWED'
      }
    });

  } catch (error) {
    console.error('Landing page mark-viewed error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark prevention as viewed'
    });
  }
});

module.exports = router;
