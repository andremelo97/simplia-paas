import { api } from '@client/config/http'

export interface SupportChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export const supportAgentService = {
  async sendMessage(message: string): Promise<{ response: string; messages: SupportChatMessage[] }> {
    const res = await api.post('/api/tq/v1/support-agent/chat', { message })
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
