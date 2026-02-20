const express = require('express');
const tenantMiddleware = require('../../../infra/middleware/tenant');
const { requireAuth, createRateLimit } = require('../../../infra/middleware/auth');
const { resolveTemplateVariables } = require('../../../services/templateVariableResolver');
const { Template, TemplateNotFoundError } = require('../../../infra/models/Template');
const { Patient, PatientNotFoundError } = require('../../../infra/models/Patient');
const { Session, SessionNotFoundError } = require('../../../infra/models/Session');
const { getTemplateFillerPrompt } = require('../../../infra/utils/aiAgentDefaults');
const { getLocaleFromTimezone } = require('../../../infra/utils/localeMapping');

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

    if (!schema) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing tenant context'
      });
    }

    const locale = getLocaleFromTimezone(req.tenant?.timezone);

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
    const {
      systemMessage: templateFillerSystemMessage,
      transcriptionLabel,
      templateLabel,
      note: fillerNote,
      instruction: fillerInstruction
    } = getTemplateFillerPrompt(locale);

    const sessionTranscriptionText = session?.transcription?.text || 'No transcription available';

    const systemMessage = templateFillerSystemMessage;

    const userPrompt = [
      transcriptionLabel,
      '"""',
      sessionTranscriptionText,
      '"""',
      '',
      templateLabel,
      '"""',
      templateForAI,
      '"""',
      '',
      fillerNote,
      '',
      fillerInstruction
    ].join('\n');

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

    console.log('🤖 [AI Agent] Sending request to OpenAI...');
    console.log('🤖 [AI Agent] Input length:', consolidatedInput.length);

    // Call OpenAI Responses API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 second timeout (3 minutes)
    let filledTemplateHtml = ''; // Declare outside try block

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          input: consolidatedInput // Prompt consolidado com regras + transcrição + template
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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

      console.log('✅ [AI Agent] Received response from OpenAI, parsing...');
      const openaiData = await openaiResponse.json();
      console.log('✅ [AI Agent] Response parsed, status:', openaiData.status);

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

      // Step 4: Clean up AI response (remove markdown code blocks if present)
      // Sometimes AI wraps HTML in ```html ... ``` markdown blocks
      let cleanedTemplate = filledTemplate.trim();
      
      // Remove markdown code block wrapper if present
      if (cleanedTemplate.startsWith('```html')) {
        cleanedTemplate = cleanedTemplate.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
      } else if (cleanedTemplate.startsWith('```')) {
        cleanedTemplate = cleanedTemplate.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      filledTemplateHtml = cleanedTemplate.trim();

      // Increment template usage count
      await Template.incrementUsage(templateId, schema);
      
      console.log('✅ [AI Agent] Template filled successfully, length:', filledTemplateHtml.length);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle AbortError (timeout)
      if (fetchError.name === 'AbortError') {
        console.error('OpenAI API request timed out after 180 seconds');
        return res.status(500).json({
          error: 'Request Timeout',
          message: 'Request to OpenAI API timed out after 3 minutes. The template may be too large or complex.'
        });
      }

      // Handle connection errors
      if (fetchError.code === 'ECONNRESET' || fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        console.error('OpenAI API connection error:', fetchError);
        return res.status(500).json({
          error: 'Connection Error',
          message: 'Unable to connect to OpenAI API. Please check your internet connection and try again.'
        });
      }

      // Re-throw other errors to be caught by outer catch
      throw fetchError;
    }

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

    console.log('📤 [AI Agent] Sending response to client...');
    res.json(response);
    console.log('✅ [AI Agent] Response sent successfully');

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
