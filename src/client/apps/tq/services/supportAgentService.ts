import { api } from '@client/config/http'

export interface SupportChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface SupportUserContext {
  firstName: string
  clinicName: string
  role: string
  roleInApp: string
}

export const supportAgentService = {
  async sendMessage(message: string, userContext?: SupportUserContext): Promise<{ response: string; messages: SupportChatMessage[] }> {
    const res = await api.post('/api/tq/v1/support-agent/chat', { message, userContext })
    return res.data
  },

  async getHistory(): Promise<SupportChatMessage[]> {
    const res = await api.get('/api/tq/v1/support-agent/history')
    return res.data?.messages || []
  },

  async clearHistory(): Promise<void> {
    await api.delete('/api/tq/v1/support-agent/history')
  }
}
