const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { SupportChatSession } = require('../../../infra/models/SupportChatSession');
const { searchDocuments } = require('../../../services/supabaseVectorSearch');

const router = express.Router();

router.use(tenantMiddleware);
router.use(requireAuth);

const supportRateLimit = createRateLimit(15 * 60 * 1000, 30); // 30 requests per 15 minutes
router.use(supportRateLimit);

/**
 * POST /support-agent/chat
 * Send a message to the Support AI Agent (RAG pipeline)
 */
router.post('/chat', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const userId = req.user?.userId;

    if (!schema) {
      return res.status(400).json({ error: 'Missing tenant context' });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // 1. Load chat history from DB
    const session = await SupportChatSession.findByUserId(userId, schema);
    const history = session?.messages || [];

    // 2. Search knowledge base for relevant documents
    const documents = await searchDocuments(message.trim(), { matchCount: 5 });
    const contextDocs = documents.map(d => d.content).join('\n---\n');

    // 3. Build system prompt with RAG context
    const systemPrompt = `You are a support assistant for the TQ system by LivoCare.
Help users understand how to use sessions, transcriptions, quotes,
clinical notes, templates, and other features.
Answer based on the documentation below. If unsure, say so and
suggest contacting human support.
You NEVER execute actions - only provide information.
Respond in the same language as the user.

Documentation:
---
${contextDocs || 'No relevant documentation found.'}
---`;

    // 4. Build messages array for OpenAI
    const openaiInput = [
      systemPrompt,
      ...history.map(m => `${m.role}: ${m.content}`),
      `user: ${message.trim()}`
    ].join('\n\n');

    // 5. Call OpenAI Responses API
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: openaiInput
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => null);
      console.error('[SupportAgent] OpenAI API error:', errorData);
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    const openaiData = await openaiResponse.json();

    if (openaiData.status !== 'completed') {
      return res.status(500).json({ error: 'AI response incomplete' });
    }

    // Extract text from Responses API format
    let aiResponse = '';
    if (openaiData.output && openaiData.output.length > 0) {
      for (const output of openaiData.output) {
        if (output.type === 'message' && output.content && Array.isArray(output.content)) {
          for (const content of output.content) {
            if ((content.type === 'text' || content.type === 'output_text') && content.text) {
              aiResponse = content.text;
              break;
            }
          }
          if (aiResponse) break;
        }
        if (output.type === 'text' && output.content) {
          aiResponse = typeof output.content === 'string' ? output.content : output.content.text || '';
          break;
        }
      }
    }
    if (!aiResponse && openaiData.text) {
      aiResponse = openaiData.text;
    }

    if (!aiResponse) {
      return res.status(500).json({ error: 'Could not extract AI response' });
    }

    // 6. Save updated history
    const updatedMessages = [
      ...history,
      { role: 'user', content: message.trim(), timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ];

    await SupportChatSession.createOrUpdate(userId, schema, updatedMessages);

    // 7. Return response
    res.json({
      data: {
        response: aiResponse,
        messages: updatedMessages
      },
      meta: { code: 'SUPPORT_RESPONSE', message: 'Support response generated' }
    });

  } catch (error) {
    console.error('[SupportAgent] Chat error:', error);
    res.status(500).json({ error: 'Failed to process support request' });
  }
});

/**
 * GET /support-agent/history
 * Get chat history for current user
 */
router.get('/history', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const userId = req.user?.userId;

    if (!schema) {
      return res.status(400).json({ error: 'Missing tenant context' });
    }

    const session = await SupportChatSession.findByUserId(userId, schema);

    res.json({
      data: { messages: session?.messages || [] },
      meta: { code: 'SUPPORT_HISTORY', message: 'Chat history retrieved' }
    });
  } catch (error) {
    console.error('[SupportAgent] History error:', error);
    res.status(500).json({ error: 'Failed to load chat history' });
  }
});

/**
 * DELETE /support-agent/history
 * Clear chat history for current user
 */
router.delete('/history', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const userId = req.user?.userId;

    if (!schema) {
      return res.status(400).json({ error: 'Missing tenant context' });
    }

    await SupportChatSession.clearHistory(userId, schema);

    res.json({
      data: null,
      meta: { code: 'SUPPORT_HISTORY_CLEARED', message: 'Chat history cleared' }
    });
  } catch (error) {
    console.error('[SupportAgent] Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

module.exports = router;
