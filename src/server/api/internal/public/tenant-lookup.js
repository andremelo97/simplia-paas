const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // 10 requests per window

// Database connection
const pool = new Pool({
  user: process.env.DATABASE_USER || 'livocare',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'livocare',
  password: process.env.DATABASE_PASSWORD || '1234',
  port: process.env.DATABASE_PORT || 5432,
});

/**
 * @swagger
 * /public/tenant-lookup:
 *   post:
 *     summary: Lookup tenant by user email (1:1 relationship)
 *     description: Returns tenant information for a given user email. Rate limited to 10 requests per 15 minutes per IP.
 *     tags:
 *       - Public
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Tenant found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 5
 *                     name:
 *                       type: string
 *                       example: "Test Andre"
 *                     slug:
 *                       type: string
 *                       example: "test-andre"
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "TENANT_NOT_FOUND"
 *                     message:
 *                       type: string
 *                       example: "Unable to authenticate with the provided credentials"
 *       429:
 *         description: Rate limit exceeded
 *       400:
 *         description: Invalid email format
 */
router.post('/tenant-lookup', async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  try {
    // Rate limiting check
    const now = Date.now();
    const rateLimitKey = clientIP;
    
    if (!rateLimitStore.has(rateLimitKey)) {
      rateLimitStore.set(rateLimitKey, { count: 0, resetTime: now + RATE_LIMIT_WINDOW });
    }
    
    const rateLimitData = rateLimitStore.get(rateLimitKey);
    
    if (now > rateLimitData.resetTime) {
      // Reset the window
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + RATE_LIMIT_WINDOW;
    }
    
    if (rateLimitData.count >= RATE_LIMIT_MAX) {
      console.log(`[SECURITY] Rate limit exceeded for IP: ${clientIP}, UA: ${userAgent}`);
      return res.status(429).json({
        success: false,
        meta: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.'
        }
      });
    }
    
    rateLimitData.count++;
    
    // Validate input
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        meta: {
          code: 'INVALID_EMAIL',
          message: 'Valid email is required'
        }
      });
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        meta: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Invalid email format'
        }
      });
    }
    
    // Hash email for logging (security)
    const emailHash = crypto.createHash('sha256').update(normalizedEmail + process.env.JWT_SECRET).digest('hex').substring(0, 16);
    
    // Query database for user and tenant (1:1 relationship)
    const query = `
      SELECT t.id, t.name, t.subdomain as slug
      FROM users u
      INNER JOIN tenants t ON u.tenant_id_fk = t.id
      WHERE u.email = $1 AND u.active = true AND t.active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [normalizedEmail]);
    
    const executionTime = Date.now() - startTime;
    
    if (result.rows.length === 0) {
      // Log failed attempt (use hash to protect privacy)
      console.log(`[AUDIT] Tenant lookup failed - Hash: ${emailHash}, IP: ${clientIP}, Time: ${executionTime}ms`);
      
      return res.status(404).json({
        success: false,
        meta: {
          code: 'TENANT_NOT_FOUND',
          message: 'Unable to authenticate with the provided credentials'
        }
      });
    }
    
    const tenant = result.rows[0];
    
    // Log successful lookup (use hash to protect privacy)
    console.log(`[AUDIT] Tenant lookup success - Hash: ${emailHash}, TenantID: ${tenant.id}, IP: ${clientIP}, Time: ${executionTime}ms`);
    
    res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      }
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[ERROR] Tenant lookup failed - IP: ${clientIP}, Time: ${executionTime}ms, Error:`, error.message);
    
    res.status(500).json({
      success: false,
      meta: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

module.exports = router;