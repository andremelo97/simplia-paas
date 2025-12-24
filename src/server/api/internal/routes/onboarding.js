const express = require('express');
const { requireAuth } = require('../../../infra/middleware/auth');
const UserOnboarding = require('../../../infra/models/UserOnboarding');

const router = express.Router();

/**
 * @openapi
 * /onboarding/status:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get onboarding status for current user
 *     description: Returns onboarding completion status for all apps (hub, tq, etc.)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       completed:
 *                         type: boolean
 *                       skipped:
 *                         type: boolean
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       skippedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const statusMap = await UserOnboarding.getStatusMap(userId);

    res.json({
      data: statusMap,
      meta: { code: 'ONBOARDING_STATUS_RETRIEVED' }
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({
      error: { code: 500, message: 'Failed to fetch onboarding status' }
    });
  }
});

/**
 * @openapi
 * /onboarding/{appSlug}/complete:
 *   post:
 *     tags: [Onboarding]
 *     summary: Mark onboarding as completed for an app
 *     description: Marks the onboarding wizard as completed for the specified app
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hub, tq]
 *         description: Application identifier
 *     responses:
 *       200:
 *         description: Onboarding marked as completed
 *       400:
 *         description: Invalid app slug
 */
router.post('/:appSlug/complete', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appSlug } = req.params;

    // Validate app slug
    const validApps = ['hub', 'tq'];
    if (!validApps.includes(appSlug)) {
      return res.status(400).json({
        error: { code: 400, message: `Invalid app slug. Must be one of: ${validApps.join(', ')}` }
      });
    }

    const onboarding = await UserOnboarding.markCompleted(userId, appSlug);

    // No meta.code to suppress automatic feedback toast
    res.json({
      data: onboarding.toJSON()
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      error: { code: 500, message: 'Failed to complete onboarding' }
    });
  }
});

/**
 * @openapi
 * /onboarding/{appSlug}/skip:
 *   post:
 *     tags: [Onboarding]
 *     summary: Skip onboarding for an app
 *     description: Marks the onboarding wizard as skipped for the specified app
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hub, tq]
 *         description: Application identifier
 *     responses:
 *       200:
 *         description: Onboarding marked as skipped
 *       400:
 *         description: Invalid app slug
 */
router.post('/:appSlug/skip', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appSlug } = req.params;

    // Validate app slug
    const validApps = ['hub', 'tq'];
    if (!validApps.includes(appSlug)) {
      return res.status(400).json({
        error: { code: 400, message: `Invalid app slug. Must be one of: ${validApps.join(', ')}` }
      });
    }

    const onboarding = await UserOnboarding.markSkipped(userId, appSlug);

    // No meta.code to suppress automatic feedback toast
    res.json({
      data: onboarding.toJSON()
    });
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    res.status(500).json({
      error: { code: 500, message: 'Failed to skip onboarding' }
    });
  }
});

/**
 * @openapi
 * /onboarding/{appSlug}/reset:
 *   post:
 *     tags: [Onboarding]
 *     summary: Reset onboarding for an app
 *     description: Resets the onboarding status, allowing the wizard to be shown again
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hub, tq]
 *         description: Application identifier
 *     responses:
 *       200:
 *         description: Onboarding reset successfully
 *       400:
 *         description: Invalid app slug
 */
router.post('/:appSlug/reset', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appSlug } = req.params;

    // Validate app slug
    const validApps = ['hub', 'tq'];
    if (!validApps.includes(appSlug)) {
      return res.status(400).json({
        error: { code: 400, message: `Invalid app slug. Must be one of: ${validApps.join(', ')}` }
      });
    }

    await UserOnboarding.reset(userId, appSlug);

    res.json({
      data: { reset: true, appSlug },
      meta: { code: 'ONBOARDING_RESET' }
    });
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    res.status(500).json({
      error: { code: 500, message: 'Failed to reset onboarding' }
    });
  }
});

/**
 * @openapi
 * /onboarding/{appSlug}/needs:
 *   get:
 *     tags: [Onboarding]
 *     summary: Check if user needs onboarding for an app
 *     description: Returns whether the user should see the onboarding wizard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appSlug
 *         required: true
 *         schema:
 *           type: string
 *           enum: [hub, tq]
 *         description: Application identifier
 *     responses:
 *       200:
 *         description: Onboarding need status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     needsOnboarding:
 *                       type: boolean
 *       400:
 *         description: Invalid app slug
 */
router.get('/:appSlug/needs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { appSlug } = req.params;

    // Validate app slug
    const validApps = ['hub', 'tq'];
    if (!validApps.includes(appSlug)) {
      return res.status(400).json({
        error: { code: 400, message: `Invalid app slug. Must be one of: ${validApps.join(', ')}` }
      });
    }

    // Only admins see onboarding wizards
    if (userRole !== 'admin') {
      return res.json({
        data: { needsOnboarding: false, reason: 'not_admin' },
        meta: { code: 'ONBOARDING_CHECK' }
      });
    }

    const needsOnboarding = await UserOnboarding.needsOnboarding(userId, appSlug);

    res.json({
      data: { needsOnboarding },
      meta: { code: 'ONBOARDING_CHECK' }
    });
  } catch (error) {
    console.error('Error checking onboarding need:', error);
    res.status(500).json({
      error: { code: 500, message: 'Failed to check onboarding status' }
    });
  }
});

module.exports = router;
