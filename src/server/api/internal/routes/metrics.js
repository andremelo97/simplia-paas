const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const database = require('../../../infra/db/database');

const router = express.Router();

// Apply authentication and platform admin role requirement
router.use(requireAuth, requirePlatformRole('internal_admin'));

// In-memory cache for metrics (TTL: 60 seconds)
const metricsCache = {
  data: null,
  timestamp: 0,
  TTL: 60000 // 60 seconds
};

/**
 * @openapi
 * /metrics/overview:
 *   get:
 *     tags: [Metrics]
 *     summary: Get platform overview metrics
 *     description: |
 *       **Scope:** Platform (Global)
 *
 *       Returns aggregated metrics for the platform dashboard including tenants, users, applications, and licenses with time-based breakdowns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform metrics retrieved successfully
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
 *                     tenants:
 *                       type: object
 *                       properties:
 *                         total: 
 *                           type: integer
 *                           example: 45
 *                         newThisWeek: 
 *                           type: integer
 *                           example: 3
 *                         newThisMonth: 
 *                           type: integer
 *                           example: 8
 *                     users:
 *                       type: object
 *                       properties:
 *                         total: 
 *                           type: integer
 *                           example: 234
 *                         newThisWeek: 
 *                           type: integer
 *                           example: 12
 *                         newThisMonth: 
 *                           type: integer
 *                           example: 35
 *                     applications:
 *                       type: object
 *                       properties:
 *                         active: 
 *                           type: integer
 *                           example: 4
 *                     licenses:
 *                       type: object
 *                       properties:
 *                         active: 
 *                           type: integer
 *                           example: 67
 *                 meta:
 *                   type: object
 *                   properties:
 *                     cachedAt:
 *                       type: string
 *                       format: date-time
 *                     executionTime:
 *                       type: string
 *                       example: "45ms"
 *       500:
 *         description: Internal server error
 */
router.get('/overview', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache first
    if (metricsCache.data && (now - metricsCache.timestamp) < metricsCache.TTL) {
      console.log('📊 [Metrics] Serving cached overview data');
      return res.json({
        success: true,
        data: metricsCache.data,
        meta: {
          cachedAt: new Date(metricsCache.timestamp).toISOString(),
          executionTime: "0ms (cached)"
        }
      });
    }
    
    console.log('📊 [Metrics] Calculating fresh overview metrics...');
    const startTime = Date.now();
    
    // Execute all queries in parallel for better performance
    const [
      tenantsMetrics,
      usersMetrics, 
      applicationsMetrics,
      licensesMetrics
    ] = await Promise.all([
      // Tenants metrics
      database.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS new_this_month,
          COUNT(*) FILTER (WHERE created_at >= (now() - interval '7 days')) AS new_this_week
        FROM tenants
        WHERE active = true
      `),
      
      // Users metrics
      database.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS new_this_month,
          COUNT(*) FILTER (WHERE created_at >= (now() - interval '7 days')) AS new_this_week
        FROM users
        WHERE active = true
      `),
      
      // Active applications
      database.query(`
        SELECT COUNT(*) AS total
        FROM applications
        WHERE active = true
      `),
      
      // Active licenses (tenant_applications)
      database.query(`
        SELECT COUNT(*) AS total
        FROM tenant_applications ta
        WHERE ta.status = 'active'
          AND (ta.expires_at IS NULL OR ta.expires_at > now())
      `)
    ]);
    
    const executionTime = Date.now() - startTime;
    
    const metricsData = {
      tenants: {
        total: parseInt(tenantsMetrics.rows[0].total),
        newThisWeek: parseInt(tenantsMetrics.rows[0].new_this_week),
        newThisMonth: parseInt(tenantsMetrics.rows[0].new_this_month)
      },
      users: {
        total: parseInt(usersMetrics.rows[0].total),
        newThisWeek: parseInt(usersMetrics.rows[0].new_this_week),
        newThisMonth: parseInt(usersMetrics.rows[0].new_this_month)
      },
      applications: {
        active: parseInt(applicationsMetrics.rows[0].total)
      },
      licenses: {
        active: parseInt(licensesMetrics.rows[0].total)
      }
    };
    
    // Update cache
    metricsCache.data = metricsData;
    metricsCache.timestamp = now;
    
    console.log(`✅ [Metrics] Overview calculated in ${executionTime}ms:`, {
      tenants: metricsData.tenants.total,
      users: metricsData.users.total,
      applications: metricsData.applications.active,
      licenses: metricsData.licenses.active
    });
    
    res.json({
      success: true,
      data: metricsData,
      meta: {
        cachedAt: new Date(now).toISOString(),
        executionTime: `${executionTime}ms`
      }
    });
    
  } catch (error) {
    console.error('❌ [Metrics] Error calculating overview:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to calculate platform metrics'
    });
  }
});

module.exports = router;