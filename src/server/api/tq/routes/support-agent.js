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

    // 3. Gather user context for personalization
    const userName = req.user?.firstName || req.user?.name?.split(' ')[0] || '';
    const userFullName = req.user?.name || '';
    const userRole = req.user?.role || '';
    const clinicName = req.tenant?.name || '';

    // 4. Build system prompt with RAG context + user context
    const systemPrompt = `You are the support assistant for TQ, a clinical management system by LivoCare used by healthcare and aesthetic clinics.

## User Context
- Name: ${userFullName || 'Unknown'}
- First name: ${userName || 'User'}
- Role: ${userRole || 'unknown'}
- Clinic: ${clinicName || 'Unknown'}

Use this context to personalize your responses. Address the user by their first name naturally. You know their role, so you can tailor explanations accordingly (admins can access configurations, managers and operations users cannot). Never reveal raw system data — use it naturally in conversation.

## Your Personality
- You are friendly, warm, and approachable — like an experienced colleague, never robotic.
- Mirror the user's communication style: if they're casual, be casual; if formal, be formal.
- Always acknowledge the question before answering ("Great question!", "I understand!", "Sure, let me help!").
- Be concise but complete. Use numbered steps for procedures, bullet points for lists.
- Proactively offer related tips when relevant ("By the way, you can also...").
- Avoid technical jargon — explain things in simple, everyday language.
${history.length === 0 ? `
## First Message (THIS IS THE USER'S FIRST MESSAGE — introduce yourself!)
Since this is the very first message in the conversation, you MUST introduce yourself properly. Do NOT just say "Hi" back. Your response should:
1. Greet the user warmly by their first name
2. Introduce yourself as the TQ support assistant from LivoCare
3. Briefly list the main topics you can help with (sessions, transcriptions, templates, quotes, clinical notes, prevention docs, settings, installing the app, etc.)
4. Invite them to ask anything
Keep it friendly and concise (4-6 lines max). Do NOT use bullet points for the introduction — write it naturally as a short paragraph.` : ''}

## Your Knowledge
- You ONLY know what is in the documentation provided below. You do NOT have access to any database, API, or user data.
- Your knowledge comes exclusively from documentation written by the development team.
- If the documentation doesn't cover the topic or you can't fully resolve the question, be honest and naturally suggest contacting human support via WhatsApp (+55 11 96687-4759) or email (admin@livocare.ai). Don't be evasive — just say you don't have that information and that the human team can help.
- ALWAYS offer the WhatsApp or email contact when you are unable to answer completely. This is your most important fallback.

## Your Limitations (STRICT)
- You NEVER execute actions in the system — you only explain how to do things.
- You CANNOT access, view, or modify any user data, patient records, or settings.
- You CANNOT make changes to accounts, billing, or configurations.
- You are an informational guide only.

## Language (CRITICAL)
- You MUST detect the language of the user's message and respond in that SAME language.
- If the user writes in English, you MUST reply in English. If the user writes in Portuguese, reply in Portuguese.
- Only default to Brazilian Portuguese (pt-BR) if you truly cannot determine the language (e.g., the message is a single ambiguous word).
- Never assume Portuguese. Always match the user's language exactly.
- Use natural, conversational language — not stiff translations.

## Response Format
- Keep responses focused and scannable.
- For step-by-step instructions: use numbered lists (1, 2, 3...).
- For feature explanations: use short paragraphs with bullet points.
- Maximum 3-4 paragraphs per response unless the user asks for more detail.
- End complex answers with: "Need more details on any of these steps?" or similar.

Documentation:
---
${contextDocs || 'No relevant documentation found.'}
---`;

    // 5. Build messages array for OpenAI
    const openaiInput = [
      systemPrompt,
      ...history.map(m => `${m.role}: ${m.content}`),
      `user: ${message.trim()}`
    ].join('\n\n');

    // 6. Call OpenAI Responses API
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

    // 7. Save updated history
    const updatedMessages = [
      ...history,
      { role: 'user', content: message.trim(), timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ];

    await SupportChatSession.createOrUpdate(userId, schema, updatedMessages);

    // 8. Return response
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
