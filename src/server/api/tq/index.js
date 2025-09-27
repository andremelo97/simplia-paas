const express = require('express');
const patientsRoutes = require('./routes/patients');
const sessionsRoutes = require('./routes/sessions');
const transcriptionRoutes = require('./routes/transcription');
const quotesRoutes = require('./routes/quotes');
const itemsRoutes = require('./routes/items');
const templatesRoutes = require('./routes/templates');
const aiAgentRoutes = require('./routes/ai-agent');

const router = express.Router();

/**
 * TQ (Transcription & Quote) App API
 *
 * All routes under /tq require:
 * - x-tenant-id header (numeric tenant ID)
 * - Bearer token authentication
 *
 * The tenant middleware automatically applies the correct schema context
 * for database operations within each route handler.
 */

// Mount resource routes
router.use('/patients', patientsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/quotes', quotesRoutes);
router.use('/items', itemsRoutes);
router.use('/templates', templatesRoutes);

// Mount transcription routes (Deepgram integration)
router.use('/transcriptions', transcriptionRoutes);

// Mount AI agent routes (OpenAI integration)
router.use('/ai-agent', aiAgentRoutes);

/**
 * @openapi
 * /tq/health:
 *   get:
 *     tags: [TQ - General]
 *     summary: Health check for TQ API
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Basic health check to verify TQ API availability for a tenant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric tenant identifier
 *     responses:
 *       200:
 *         description: TQ API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string }
 *                 message: { type: string }
 *                 tenant: { type: string }
 *       400:
 *         description: Missing tenant context
 *       401:
 *         description: Authentication required
 */
router.get('/health', (req, res) => {
  const tenantId = req.tenant?.id;
  const schema = req.tenant?.schema;

  if (!tenantId || !schema) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing tenant context'
    });
  }

  res.json({
    status: 'healthy',
    message: 'TQ API is operational',
    tenant: {
      id: tenantId,
      schema: schema
    }
  });
});

module.exports = router;