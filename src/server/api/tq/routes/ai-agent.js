const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { resolveTemplateVariables } = require('../../../services/templateVariableResolver');
const { Template, TemplateNotFoundError } = require('../../../infra/models/Template');
const { Patient, PatientNotFoundError } = require('../../../infra/models/Patient');
const { Session, SessionNotFoundError } = require('../../../infra/models/Session');

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

/**
 * @openapi
 * /tq/ai-agent/fill-template:
 *   post:
 *     tags: [TQ - AI Agent]
 *     summary: Fill template with AI using session transcription
 *     description: |
 *       **Scope:** Tenant (x-tenant-id required)
 *
 *       Uses AI to fill a template with information from session transcription and system variables.
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
 *             required:
 *               - templateId
 *               - sessionId
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: Template to fill
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Session with transcription data
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: Patient ID (optional, will use session's patient if not provided)
 *     responses:
 *       200:
 *         description: Template filled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalTemplate:
 *                       type: string
 *                       description: Original template content
 *                     filledTemplate:
 *                       type: string
 *                       description: Template filled with AI and system variables
 *                     systemVariablesResolved:
 *                       type: object
 *                       description: System variables that were resolved
 *                     aiPrompt:
 *                       type: string
 *                       description: The prompt sent to AI
 *                 meta:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "TEMPLATE_FILLED"
 *                     message:
 *                       type: string
 *                       example: "Template filled successfully"
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Template, session, or patient not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/fill-template', async (req, res) => {
  try {
    const schema = req.tenant?.schema;
    const { templateId, sessionId, patientId } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!templateId || !sessionId) {
      return res.status(400).json({
        error: 'Template ID and Session ID are required'
      });
    }

    // Load template
    const template = await Template.findById(templateId, schema);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Load session
    const session = await Session.findById(sessionId, schema);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Load patient (from session or provided patientId)
    const targetPatientId = patientId || session.patient_id;
    let patient = null;
    if (targetPatientId) {
      try {
        patient = await Patient.findById(targetPatientId, schema);
      } catch (error) {
        // Patient not found is not critical for template filling
        console.warn('Patient not found for template filling:', targetPatientId);
      }
    }

    // Get current user data for "me" variables
    // TODO: Load user profile data properly
    const currentUser = {
      id: userId,
      first_name: req.user?.first_name || '',
      last_name: req.user?.last_name || '',
      clinic: req.user?.clinic || '' // TODO: Define clinic field structure
    };

    // Step 1: Resolve system variables
    const variableContext = {
      patient,
      session,
      user: currentUser,
      tenantId: req.tenant?.id
    };

    const templateWithVariables = resolveTemplateVariables(template.content, variableContext);

    // Step 2: Prepare AI prompt for template filling
    const systemMessage = `You are a clinical documentation assistant. Fill the provided template using ONLY information from the dialogue/transcription.

Template Syntax:
- [placeholder] = Fill with dialogue content or clinical information
- (instruction) = Behavior guide (REMOVE from output completely)
- System variables like $patient.first_name$ have already been filled

Rules:
- Use ONLY explicit information from the transcription
- Never invent medical details not mentioned
- Remove empty placeholders or leave them as [not mentioned]
- Remove all instructions in parentheses from final output
- Maintain template structure exactly
- Be concise and professional

Output: Complete filled template ready for clinical use.`;

    const userPrompt = `Session Transcription:
"""
${session.transcription || 'No transcription available'}
"""

Template to fill:
"""
${templateWithVariables}
"""

Please fill this template using only the information from the transcription above.`;

    // TODO: Step 3: Call OpenAI API to fill template
    // For now, return template with variables resolved as a placeholder
    const filledTemplate = templateWithVariables; // This will be replaced with AI-filled content

    // Increment template usage count
    await Template.incrementUsage(templateId, schema);

    const response = {
      data: {
        originalTemplate: template.content,
        filledTemplate,
        systemVariablesResolved: {
          'patient.first_name': patient?.first_name || '',
          'patient.last_name': patient?.last_name || '',
          'date.now': new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          'session.created_at': session?.created_at ?
            new Date(session.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : '',
          'me.first_name': currentUser.first_name,
          'me.last_name': currentUser.last_name,
          'me.clinic': currentUser.clinic
        },
        aiPrompt: userPrompt,
        systemMessage
      },
      meta: {
        code: 'TEMPLATE_FILLED',
        message: 'Template filled successfully'
      }
    };

    res.json(response);

  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return res.status(404).json({ error: 'Template not found' });
    }
    if (error instanceof SessionNotFoundError) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (error instanceof PatientNotFoundError) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    console.error('Error filling template:', error);
    res.status(500).json({ error: 'Failed to fill template' });
  }
});

module.exports = router;