const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');

const router = express.Router();

// Apply tenant middleware to all TQ routes
router.use(tenantMiddleware);

// Apply authentication to all TQ routes
router.use(requireAuth);

// Apply rate limiting (more restrictive for AI calls)
const aiRateLimit = createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes
router.use(aiRateLimit);

/**
 * @openapi
 * /tq/ai-agent/chat:
 *   post:
 *     tags: [TQ - AI Agent]
 *     summary: Chat with AI Agent for medical summaries
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Send messages to AI Agent for creating medical summaries from transcriptions.
 *       Uses OpenAI GPT-4o-mini model.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[1-9][0-9]*$'
 *         description: Numeric tenant identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messages]
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *                 description: Chat message history
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                       description: AI-generated response
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code: { type: string }
 *                     message: { type: string }
 *       400:
 *         description: Validation error or missing tenant context
 *       401:
 *         description: Authentication required
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: OpenAI API error or internal server error
 */
router.post('/chat', async (req, res) => {
  try {
    const schema = req.tenant?.schema;

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Messages array is required and cannot be empty'
      });
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Each message must have role and content'
        });
      }
      if (!['user', 'assistant'].includes(message.role)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Message role must be either "user" or "assistant"'
        });
      }
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'OpenAI API key is not configured'
      });
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3, // Lower temperature for more consistent medical summaries
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => null);
      console.error('OpenAI API Error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData
      });

      return res.status(500).json({
        error: 'OpenAI API Error',
        message: `Failed to get response from OpenAI: ${openaiResponse.status} ${openaiResponse.statusText}`
      });
    }

    const openaiData = await openaiResponse.json();

    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      console.error('Invalid OpenAI Response:', openaiData);
      return res.status(500).json({
        error: 'OpenAI Response Error',
        message: 'Invalid response format from OpenAI'
      });
    }

    const aiResponse = openaiData.choices[0].message.content;

    res.json({
      data: {
        response: aiResponse
      },
      meta: {
        code: 'AI_RESPONSE_GENERATED',
        message: 'AI response generated successfully'
      }
    });

  } catch (error) {
    console.error('AI Agent chat error:', error);

    // Handle specific error types
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({
        error: 'Network Error',
        message: 'Unable to connect to OpenAI API'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process AI chat request'
    });
  }
});

module.exports = router;