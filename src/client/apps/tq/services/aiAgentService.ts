import { api } from '@client/config/http'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIChatRequest {
  messages: ChatMessage[]
  sessionId?: string
  patientId?: string
}

export interface AIChatResponse {
  response: string
}

export interface FillTemplateRequest {
  templateId: string
  sessionId: string
  patientId?: string
}

export interface FillTemplateResponse {
  originalTemplate: string
  filledTemplate: string
  systemVariablesResolved: Record<string, string>
  aiPrompt: string
  systemMessage: string
}

export interface Patient {
  firstName?: string
  lastName?: string
  email?: string
}

export const aiAgentService = {
  /**
   * Send messages to AI Agent for chat completion
   * Returns both the AI response and the system message used (for display)
   */
  async sendMessage(messages: ChatMessage[], sessionId?: string, patientId?: string): Promise<{response: string, systemMessageUsed?: string}> {
    const response = await api.post('/api/tq/v1/ai-agent/chat', {
      messages,
      sessionId,
      patientId
    })

    if (!response.data || !response.data.response) {
      throw new Error('Invalid AI response format')
    }

    return {
      response: response.data.response,
      systemMessageUsed: response.data.systemMessageUsed
    }
  },

  /**
   * Create initial user message with system message preview
   * Shows the configured system message but replaces $transcription$ with "..."
   * The full text is sent to backend for processing
   */
  createInitialMessage(systemMessage: string, transcription: string): ChatMessage[] {
    // Get first 3 words of transcription for preview
    const words = transcription.trim().split(/\s+/)
    const transcriptionPreview = words.length > 3 
      ? words.slice(0, 3).join(' ') + '...'
      : transcription
    
    // Replace $transcription$ variable with truncated version for display
    // All other variables will be resolved by backend
    const displayContent = systemMessage.replace(/\$transcription\$/g, transcriptionPreview)
    
    return [
      {
        role: 'user',
        content: displayContent
      }
    ]
  },

  /**
   * Add user message to conversation
   */
  addUserMessage(messages: ChatMessage[], userMessage: string): ChatMessage[] {
    return [
      ...messages,
      {
        role: 'user',
        content: userMessage
      }
    ]
  },

  /**
   * Add AI response to conversation
   */
  addAIResponse(messages: ChatMessage[], aiResponse: string | {response: string, systemMessageUsed?: string}): ChatMessage[] {
    const content = typeof aiResponse === 'string' ? aiResponse : aiResponse.response
    return [
      ...messages,
      {
        role: 'assistant',
        content
      }
    ]
  },

  /**
   * Fill template with AI using session transcription
   */
  async fillTemplate(request: FillTemplateRequest): Promise<FillTemplateResponse> {
    const response = await api.post('/api/tq/v1/ai-agent/fill-template', request)

    if (!response.data || !response.data.filledTemplate) {
      throw new Error('Invalid template fill response format')
    }

    return response.data
  }
}