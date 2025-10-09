const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { resolveTemplateVariables } = require('../../../services/templateVariableResolver');
const { stripHtmlToText, textToHtml } = require('../../../infra/utils/htmlConverter');
const { Template, TemplateNotFoundError } = require('../../../infra/models/Template');
const { Patient, PatientNotFoundError } = require('../../../infra/models/Patient');
const { Session, SessionNotFoundError } = require('../../../infra/models/Session');
const { AIAgentConfiguration } = require('../../../infra/models/AIAgentConfiguration');

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
 *       Uses OpenAI Responses API with gpt-5-mini model.
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

    const { messages, sessionId, patientId } = req.body;

    // Allow empty messages array if sessionId is provided (initial conversation)
    // Backend will add system message with resolved variables
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Messages array is required'
      });
    }

    if (messages.length === 0 && !sessionId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Messages array cannot be empty unless sessionId is provided for initial conversation'
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

    // Get AI Agent configuration
    const aiConfig = await AIAgentConfiguration.findByTenant(schema);
    let systemMessage = aiConfig.systemMessage || AIAgentConfiguration.getDefaultSystemMessage();

    // Load session and patient data if provided (for variable resolution)
    let session = null;
    let patient = null;
    let transcription = null;

    if (sessionId) {
      try {
        // Session.findById(id, schema, includePatient)
        session = await Session.findById(sessionId, schema, true);
        if (session) {
          // Session já vem com patient e transcription carregados
          patient = session.patient || null;
          transcription = session.transcription?.text || null;
          
          console.log('🔍 [AI Agent] Session loaded:', {
            sessionId: session.id,
            hasPatient: !!patient,
            hasTranscription: !!transcription,
            transcriptionLength: transcription?.length || 0
          });
        }
      } catch (error) {
        console.warn(`[AI Agent] Session ${sessionId} not found:`, error.message);
      }
    }

    if (!patient && patientId) {
      try {
        patient = await Patient.findById(patientId, schema);
      } catch (error) {
        console.warn(`[AI Agent] Patient ${patientId} not found:`, error.message);
      }
    }

    // Resolve variables in system message
    const variableContext = {
      patient,
      session,
      transcription,
      user: req.user,
      tenantId: req.tenant?.id
    };

    systemMessage = resolveTemplateVariables(systemMessage, variableContext);

    console.log('🤖 [AI Agent] System message after variable resolution:', systemMessage.substring(0, 200));
    console.log('🤖 [AI Agent] Has transcription:', !!transcription);

    // Call OpenAI Responses API with system message prepended
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: `${systemMessage}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
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

    // Extract text from Responses API format
    let aiResponse = '';

    // Check if response is complete
    if (openaiData.status !== 'completed') {
      console.error('OpenAI Response incomplete:', openaiData);
      return res.status(500).json({
        error: 'OpenAI Response Error',
        message: `OpenAI response is ${openaiData.status}. Reason: ${openaiData.incomplete_details?.reason || 'unknown'}`
      });
    }

    // Try to extract text from various possible locations
    if (openaiData.output && openaiData.output.length > 0) {
      // Look for message type in output array
      for (const output of openaiData.output) {
        // Check for message type with content array
        if (output.type === 'message' && output.content && Array.isArray(output.content)) {
          for (const content of output.content) {
            if ((content.type === 'text' || content.type === 'output_text') && content.text) {
              aiResponse = content.text;
              break;
            }
          }
          if (aiResponse) break;
        }
        // Check for direct text type
        if (output.type === 'text' && output.content) {
          aiResponse = typeof output.content === 'string' ? output.content : output.content.text || '';
          break;
        }
      }
    }

    // Fallback to direct text property
    if (!aiResponse && openaiData.text) {
      aiResponse = openaiData.text;
    }

    if (!aiResponse || typeof aiResponse !== 'string') {
      console.error('Invalid OpenAI Response:', openaiData);
      return res.status(500).json({
        error: 'OpenAI Response Error',
        message: 'Could not extract text content from OpenAI response'
      });
    }

    res.json({
      data: {
        response: aiResponse,
        systemMessageUsed: systemMessage // Return resolved system message to frontend
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
 *       Uses OpenAI Responses API with gpt-5-mini model.
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
    const currentUser = {
      id: userId,
      first_name: req.user?.firstName || '',  // User model uses camelCase
      last_name: req.user?.lastName || '',    // User model uses camelCase
      clinic: req.tenant?.name || '' // Use tenant name as clinic name
    };

    // Step 1: Resolve system variables
    const variableContext = {
      patient,
      session,
      user: currentUser,
      tenantId: req.tenant?.id
    };

    // Debug logging
    console.log('🔍 [AI Agent] Variable Context:', {
      patient: patient ? `${patient.firstName} ${patient.lastName}` : 'NO PATIENT',
      sessionCreatedAt: session?.createdAt || 'NO SESSION DATE',
      user: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'NO USER',
      templateId: templateId
    });

    const templateWithVariables = resolveTemplateVariables(template.content, variableContext);

    console.log('📝 [AI Agent] Template after variable resolution (first 200 chars):',
      templateWithVariables.substring(0, 200));

    // Step 2: Keep HTML template as-is for AI processing
    // COMMENTED OUT: Old approach that stripped HTML
    // const templateForAI = stripHtmlToText(templateWithVariables);
    const templateForAI = templateWithVariables; // Use HTML directly

    // Step 2: Prepare AI prompt for template filling with HTML preservation
    const systemMessage = `You are a clinical documentation assistant. Fill the provided HTML template using ONLY information from the dialogue/transcription. You may note receive the transcription formatted as a perfect dialogue, so try to guess it: there are at least 2 personas.

CRITICAL HTML PRESERVATION RULES:
1. Return the COMPLETE HTML exactly as provided, with ALL tags preserved (<p>, <strong>, <br>, etc.)
2. DO NOT modify, add, or remove ANY HTML tags
3. DO NOT escape HTML (no &lt; or &gt;)
4. DO NOT add markdown formatting (**, ##, -, etc.)
5. Keep ALL empty paragraphs <p></p> for spacing
6. Keep ALL <strong> tags and other formatting tags

CRITICAL CONTENT RULES - WHAT YOU CAN AND CANNOT CHANGE:

✅ YOU CAN ONLY CHANGE:
- Content inside [square brackets] - these are placeholders to fill with transcription data
- Content inside (round brackets) - these are instructions, follow them and remove the brackets

❌ YOU MUST NEVER CHANGE:
- Any text OUTSIDE of [brackets] or (parentheses)
- Patient names, doctor names, dates, or any other data already filled in the template
- These are REAL DATA from the system database, NOT from the transcription
- Even if the transcription mentions different names, DO NOT change what's already in the template

Example:
Template: "<strong>Patient Name:</strong> John Smith <strong>Doctor:</strong> Dr. Jane Doe [Chief Complaint]"
Transcription: "Hi, I'm Bob. Dr. Sarah told me to come in. I have tooth pain."
Correct Output: "<strong>Patient Name:</strong> John Smith <strong>Doctor:</strong> Dr. Jane Doe tooth pain"
WRONG Output: "<strong>Patient Name:</strong> Bob <strong>Doctor:</strong> Dr. Sarah tooth pain"

Template Syntax:
- Placeholders are wrapped in **square brackets [ ]**. Replace ONLY the content inside brackets with real information from the dialogue.
- Instructions are wrapped in **round brackets ( )**. Follow the instruction, then REMOVE the parentheses and instruction text from output.
- System variables like $variable$ are already replaced, leave any remaining as-is.

Rules:
- Never invent or assume medical information
- Only include content explicitly found in the dialogue or contextual notes
- If a placeholder cannot be filled, leave it as-is or remove just that placeholder (keep surrounding HTML)
- Do not say "this was not mentioned" or "no data available"
- Use structured, complete sentences when replacing placeholders
- Maintain ALL HTML structure exactly as given

CRITICAL: Return ONLY the filled HTML template. No explanations, no code blocks, no wrapping.`;

    const userPrompt = `Session Transcription:
"""
${session.transcription?.text || 'No transcription available'}
"""

HTML Template to fill:
"""
${templateForAI}
"""

Note: You may receive dialogue and template in languages other than English, so do not assume all input will be in English. Always process the content exactly as written in the original input.

Please fill this HTML template using only the information from the transcription above. Return the complete filled HTML.`;

    // Step 3: Call OpenAI API to fill template
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'OpenAI API key is not configured'
      });
    }

    // Consolidate prompt for Responses API
    const consolidatedInput = `${systemMessage}\n\n${userPrompt}`;

    // Call OpenAI Responses API
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: consolidatedInput // Prompt consolidado com regras + transcrição + template
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

    // Extract text from Responses API format
    let filledTemplate = '';

    // Check if response is complete
    if (openaiData.status !== 'completed') {
      console.error('OpenAI Response incomplete:', openaiData);
      return res.status(500).json({
        error: 'OpenAI Response Error',
        message: `OpenAI response is ${openaiData.status}. Reason: ${openaiData.incomplete_details?.reason || 'unknown'}`
      });
    }

    // Try to extract text from various possible locations
    if (openaiData.output && openaiData.output.length > 0) {
      // Look for message type in output array
      for (const output of openaiData.output) {
        // Check for message type with content array
        if (output.type === 'message' && output.content && Array.isArray(output.content)) {
          for (const content of output.content) {
            if ((content.type === 'text' || content.type === 'output_text') && content.text) {
              filledTemplate = content.text;
              break;
            }
          }
          if (filledTemplate) break;
        }
        // Check for direct text type
        if (output.type === 'text' && output.content) {
          filledTemplate = typeof output.content === 'string' ? output.content : output.content.text || '';
          break;
        }
      }
    }

    // Fallback to direct text property
    if (!filledTemplate && openaiData.text) {
      filledTemplate = openaiData.text;
    }

    if (!filledTemplate || typeof filledTemplate !== 'string') {
      console.error('Invalid OpenAI Response:', openaiData);
      return res.status(500).json({
        error: 'OpenAI Response Error',
        message: 'Could not extract text content from OpenAI response'
      });
    }

    // Step 4: Use AI response directly (already HTML)
    // COMMENTED OUT: Old approach that converted plain text to HTML
    // const filledTemplateHtml = textToHtml(filledTemplate);
    const filledTemplateHtml = filledTemplate; // Already HTML from AI

    // Increment template usage count
    await Template.incrementUsage(templateId, schema);

    const response = {
      data: {
        originalTemplate: template.content,
        filledTemplate: filledTemplateHtml,
        systemVariablesResolved: {
          'patient.first_name': patient?.firstName || '',
          'patient.last_name': patient?.lastName || '',
          'patient.fullName': patient ?
            `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'
            : '',
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
          'me.fullName': currentUser ?
            `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Doctor'
            : '',
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

    // Handle specific error types
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({
        error: 'Network Error',
        message: 'Unable to connect to OpenAI API'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fill template'
    });
  }
});

module.exports = router;