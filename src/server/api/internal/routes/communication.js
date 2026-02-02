const express = require('express')
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth')
const TenantCommunicationSettings = require('../../../infra/models/TenantCommunicationSettings')

const router = express.Router()

// Apply authentication and rate limiting (mirrors branding configuration route behaviour)
router.use(requireAuth)
const internalRateLimit = createRateLimit(15 * 60 * 1000, 200)
router.use(internalRateLimit)

/**
 * @swagger
 * /configurations/communication:
 *   get:
 *     summary: Get communication settings (SMTP, webhooks, etc) for current tenant
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Communication settings retrieved (or null if not configured)
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Tenant ID not found in user context'
      })
    }

    const settings = await TenantCommunicationSettings.findByTenantId(tenantId)

    return res.json({
      data: settings ? settings.toJSON() : null,
      meta: {
        code: 'COMMUNICATION_SETTINGS_RETRIEVED'
      }
    })
  } catch (error) {
    console.error('[Communication Configuration] Error fetching settings:', error)
    return res.status(500).json({
      error: 'Failed to fetch communication settings',
      message: error.message
    })
  }
})

/**
 * @swagger
 * /configurations/communication:
 *   post:
 *     summary: Create or update communication settings for current tenant
 *     description: |
 *       Currently supports SMTP configuration. Additional channels can be added in the future.
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smtpHost
 *               - smtpUsername
 *               - smtpPassword
 *               - smtpFromEmail
 *             properties:
 *               smtpHost:
 *                 type: string
 *                 example: smtp.gmail.com
 *               smtpPort:
 *                 type: integer
 *                 default: 587
 *               smtpSecure:
 *                 type: boolean
 *                 default: true
 *               smtpUsername:
 *                 type: string
 *                 example: user@example.com
 *               smtpPassword:
 *                 type: string
 *                 example: yourpassword
 *               smtpFromEmail:
 *                 type: string
 *                 example: noreply@example.com
 *               smtpFromName:
 *                 type: string
 *                 example: My Clinic
 *     responses:
 *       200:
 *         description: Communication settings saved successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId

    if (!tenantId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Tenant ID not found in user context'
      })
    }

    const {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUsername,
      smtpPassword,
      smtpFromEmail,
      smtpFromName,
      ccEmails
    } = req.body

    const settings = await TenantCommunicationSettings.upsert(tenantId, {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUsername,
      smtpPassword,
      smtpFromEmail,
      smtpFromName,
      ccEmails
    })

    return res.json({
      data: settings.toJSON(),
      meta: {
        code: 'COMMUNICATION_SETTINGS_SAVED',
        message: 'Communication settings saved successfully'
      }
    })
  } catch (error) {
    console.error('[Communication Configuration] Error saving settings:', error)

    if (error.message.includes('Missing required') || error.message.includes('Invalid email')) {
      return res.status(400).json({
        error: 'Invalid input',
        message: error.message
      })
    }

    return res.status(500).json({
      error: 'Failed to save communication settings',
      message: error.message
    })
  }
})

module.exports = router
