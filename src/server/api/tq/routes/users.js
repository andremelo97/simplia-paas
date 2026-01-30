const express = require('express');
const User = require('../../../infra/models/User');

const router = express.Router();

/**
 * @swagger
 * /tq/users:
 *   get:
 *     summary: List tenant users for filters
 *     description: Get list of users within the tenant for use in filter dropdowns
 *     tags: [TQ - Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of users
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
 *                       id:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const { search, limit = 50 } = req.query;

    const users = await User.findByTenant(tenantId, {
      search,
      limit: parseInt(limit),
      status: 'active'
    });

    res.json({
      data: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      }))
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list users'
    });
  }
});

module.exports = router;
