const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const AccessLog = require('../../../infra/models/AccessLog');

const router = express.Router();

// All audit routes require platform admin role
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @openapi
 * /audit/access-logs:
 *   get:
 *     tags: [Audit & Compliance]
 *     summary: Query access logs
 *     description: |
 *       Get paginated access logs with comprehensive filtering for compliance and security monitoring.
 *       Supports filtering by tenant, application, decision, time period, user, and IP address.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by specific tenant ID
 *       - in: query
 *         name: applicationSlug
 *         schema:
 *           type: string
 *         description: Filter by application (tq, pm, billing, reports)
 *       - in: query
 *         name: decision
 *         schema:
 *           type: string
 *           enum: [granted, denied]
 *         description: Filter by access decision
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by specific user ID
 *       - in: query
 *         name: ipAddress
 *         schema:
 *           type: string
 *         description: Filter by IP address
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs after this date (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs before this date (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of logs to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [timestamp, tenant, user, application]
 *           default: timestamp
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Access logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           tenantId: { type: integer }
 *                           tenantName: { type: string }
 *                           userId: { type: integer }
 *                           userEmail: { type: string }
 *                           applicationSlug: { type: string }
 *                           requestPath: { type: string }
 *                           requestMethod: { type: string }
 *                           decision: { type: string }
 *                           reason: { type: string }
 *                           ipAddress: { type: string }
 *                           userAgent: { type: string }
 *                           timestamp: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         limit: { type: integer }
 *                         offset: { type: integer }
 *                         hasMore: { type: boolean }
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalAccess: { type: integer }
 *                         grantedAccess: { type: integer }
 *                         deniedAccess: { type: integer }
 *                         uniqueUsers: { type: integer }
 *                         uniqueTenants: { type: integer }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 *       400:
 *         description: Invalid query parameters
 */
router.get('/access-logs', async (req, res) => {
  try {
    const {
      tenantId,
      applicationSlug,
      decision,
      userId,
      ipAddress,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Validate parameters
    const validSortFields = ['timestamp', 'tenant', 'user', 'application'];
    const validSortOrders = ['asc', 'desc'];
    const validDecisions = ['granted', 'denied'];

    if (sortBy && !validSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid sortBy. Must be one of: ${validSortFields.join(', ')}`
      });
    }

    if (sortOrder && !validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid sortOrder. Must be one of: ${validSortOrders.join(', ')}`
      });
    }

    if (decision && !validDecisions.includes(decision)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    const filters = {
      tenantId: tenantId ? parseInt(tenantId) : undefined,
      applicationSlug,
      decision,
      userId: userId ? parseInt(userId) : undefined,
      ipAddress,
      startDate,
      endDate
    };

    const options = {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    };

    const logs = await AccessLog.findFiltered(filters, options);
    const total = await AccessLog.count(filters);
    const summary = await AccessLog.getSummary(filters);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => log.toJSON()),
        pagination: {
          total,
          limit: options.limit,
          offset: options.offset,
          hasMore: options.offset + logs.length < total
        },
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch access logs'
    });
  }
});

/**
 * @openapi
 * /audit/access-summary:
 *   get:
 *     tags: [Audit & Compliance]
 *     summary: Get access summary statistics
 *     description: |
 *       Get aggregated statistics for access patterns, security insights, and compliance metrics.
 *       Useful for dashboards and monitoring.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Time period for statistics
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by specific tenant ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter statistics after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter statistics before this date
 *     responses:
 *       200:
 *         description: Access summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalRequests: { type: integer }
 *                         grantedRequests: { type: integer }
 *                         deniedRequests: { type: integer }
 *                         denialRate: { type: number }
 *                         uniqueUsers: { type: integer }
 *                         uniqueTenants: { type: integer }
 *                         uniqueIPs: { type: integer }
 *                     byApplication:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           application: { type: string }
 *                           total: { type: integer }
 *                           granted: { type: integer }
 *                           denied: { type: integer }
 *                     byTenant:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tenantId: { type: integer }
 *                           tenantName: { type: string }
 *                           total: { type: integer }
 *                           granted: { type: integer }
 *                           denied: { type: integer }
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period: { type: string }
 *                           total: { type: integer }
 *                           granted: { type: integer }
 *                           denied: { type: integer }
 *                     topDenialReasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reason: { type: string }
 *                           count: { type: integer }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/access-summary', async (req, res) => {
  try {
    const {
      period = 'day',
      tenantId,
      startDate,
      endDate
    } = req.query;

    const validPeriods = ['hour', 'day', 'week', 'month'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
      });
    }

    const filters = {
      tenantId: tenantId ? parseInt(tenantId) : undefined,
      startDate,
      endDate
    };

    const [
      overview,
      byApplication,
      byTenant,
      timeline,
      topDenialReasons
    ] = await Promise.all([
      AccessLog.getOverview(filters),
      AccessLog.getByApplication(filters),
      AccessLog.getByTenant(filters),
      AccessLog.getTimeline(filters, period),
      AccessLog.getTopDenialReasons(filters)
    ]);

    res.json({
      success: true,
      data: {
        overview,
        byApplication,
        byTenant,
        timeline,
        topDenialReasons
      }
    });
  } catch (error) {
    console.error('Error fetching access summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch access summary'
    });
  }
});

/**
 * @openapi
 * /audit/security-alerts:
 *   get:
 *     tags: [Audit & Compliance]
 *     summary: Get security alerts
 *     description: |
 *       Get potential security issues and anomalies detected in access patterns.
 *       Includes suspicious IP addresses, repeated failures, and unusual access patterns.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by alert severity
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 168
 *           default: 24
 *         description: Look for alerts in the last N hours
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 25
 *         description: Number of alerts to return
 *     responses:
 *       200:
 *         description: Security alerts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           type: { type: string }
 *                           severity: { type: string }
 *                           title: { type: string }
 *                           description: { type: string }
 *                           tenantId: { type: integer }
 *                           userId: { type: integer }
 *                           ipAddress: { type: string }
 *                           count: { type: integer }
 *                           firstSeen: { type: string }
 *                           lastSeen: { type: string }
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalAlerts: { type: integer }
 *                         criticalAlerts: { type: integer }
 *                         highAlerts: { type: integer }
 *                         mediumAlerts: { type: integer }
 *                         lowAlerts: { type: integer }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient platform privileges
 */
router.get('/security-alerts', async (req, res) => {
  try {
    const {
      severity,
      hours = 24,
      limit = 25
    } = req.query;

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
      });
    }

    const hoursInt = Math.min(Math.max(parseInt(hours), 1), 168); // 1 hour to 7 days
    const limitInt = Math.min(parseInt(limit), 50);

    const alerts = await AccessLog.getSecurityAlerts({
      severity,
      hours: hoursInt,
      limit: limitInt
    });

    const summary = {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      highAlerts: alerts.filter(a => a.severity === 'high').length,
      mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
      lowAlerts: alerts.filter(a => a.severity === 'low').length
    };

    res.json({
      success: true,
      data: {
        alerts,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch security alerts'
    });
  }
});

module.exports = router;