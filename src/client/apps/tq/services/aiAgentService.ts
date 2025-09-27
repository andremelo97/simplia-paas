import { api } from '@client/config/http'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIChatRequest {
  messages: ChatMessage[]
}

export interface AIChatResponse {
  response: string
}

export interface Patient {
  firstName?: string
  lastName?: string
  email?: string
}

export const aiAgentService = {
  /**
   * Send messages to AI Agent for chat completion
   */
  async sendMessage(messages: ChatMessage[]): Promise<string> {
    const response = await api.post('/api/tq/v1/ai-agent/chat', {
      messages
    })

    if (!response.data || !response.data.response) {
      throw new Error('Invalid AI response format')
    }

    return response.data.response
  },

  /**
   * Create initial AI prompt for medical summary generation
   */
  createInitialPrompt(transcription: string, patient: Patient | null): ChatMessage[] {
    const patientName = patient
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || '[Patient Name]'
      : '[Patient Name]'

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const initialPrompt = `Below I'm sending a consultation transcription. Create a clear and comprehensive treatment summary written directly for the patient.

Rules:
• Write in 2nd person not 3rd person
• Use only what is explicitly stated in the transcript. Do not invent, assume, or infer anything.
• Do not include anything related to prices or costs.
• Begin the summary with:
Patient Name: ${patientName}
Date of Visit: ${today}
• Structure the summary in clear sections
• Do not add any conclusion, just end the summary with this exact closing text:

If you have any questions or concerns about your treatment, please don't hesitate to contact us. We are here to help you understand and feel comfortable with your dental care.
We appreciate the opportunity to care for your smile and look forward to seeing you at your next visit.

Here is the transcription:

${transcription}`

    return [
      {
        role: 'user',
        content: initialPrompt
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
  addAIResponse(messages: ChatMessage[], aiResponse: string): ChatMessage[] {
    return [
      ...messages,
      {
        role: 'assistant',
        content: aiResponse
      }
    ]
  }
}