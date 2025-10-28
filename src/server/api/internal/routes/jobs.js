/**
 * Background Jobs Status Routes
 *
 * Endpoints for monitoring background job executions
 */

const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const { requirePlatformRole } = require('../../../infra/middleware/platformRole');
const router = express.Router();
const database = require('../../../infra/db/database');

// Apply authentication and platform admin role requirement
router.use(requireAuth, requirePlatformRole('internal_admin'));

/**
 * @swagger
 * /jobs/status:
 *   get:
 *     summary: Get background jobs status
 *     description: Returns the latest execution status for all background jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Jobs status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       job_name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                       duration_ms:
 *                         type: integer
 *                       stats:
 *                         type: object
 *                       error_message:
 *                         type: string
 */
router.get('/status', async (req, res) => {
  try {
    // Get latest execution for each job
    const query = `
      WITH latest_executions AS (
        SELECT DISTINCT ON (job_name)
          job_name,
          status,
          started_at,
          completed_at,
          duration_ms,
          stats,
          error_message
        FROM public.job_executions
        ORDER BY job_name, started_at DESC
      )
      SELECT * FROM latest_executions
      ORDER BY job_name
    `;

    const result = await database.query(query);

    res.json({
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch job status'
      }
    });
  }
});

/**
 * @swagger
 * /jobs/history:
 *   get:
 *     summary: Get job execution history
 *     description: Returns the last N executions for all jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of executions to return
 *     responses:
 *       200:
 *         description: Job history retrieved successfully
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const query = `
      SELECT
        id,
        job_name,
        status,
        started_at,
        completed_at,
        duration_ms,
        stats,
        error_message
      FROM public.job_executions
      ORDER BY started_at DESC
      LIMIT $1
    `;

    const result = await database.query(query, [limit]);

    res.json({
      data: result.rows,
      meta: {
        total: result.rows.length,
        limit: limit
      }
    });

  } catch (error) {
    console.error('Error fetching job history:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to fetch job history'
      }
    });
  }
});

module.exports = router;
