import { api } from '@client/config/http'

export interface CommunicationSettings {
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUsername: string
  smtpPassword: string
  smtpFromEmail: string
}

const RESOURCE = '/internal/api/v1/configurations/communication'

interface CommunicationSettingsResponse {
  data: CommunicationSettings | null
  meta?: {
    code: string
    message?: string
  }
}

export const communicationService = {
  async getSettings(): Promise<CommunicationSettings | null> {
    const response = await api.get(RESOURCE) as CommunicationSettingsResponse
    return response?.data ?? null
  },

  async updateSettings(settings: CommunicationSettings): Promise<CommunicationSettings> {
    const response = await api.post(RESOURCE, settings) as CommunicationSettingsResponse
    return response?.data as CommunicationSettings
  }
}

