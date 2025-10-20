import { api } from '@client/config/http'

export interface TenantTranscriptionConfig {
  id: number
  tenantId: number
  planId: number
  customMonthlyLimit: number | null
  overageAllowed: boolean
  createdAt: string
  updatedAt: string
  plan?: {
    slug: string
    name: string
    monthlyMinutesLimit: number
    allowsCustomLimits: boolean
  }
  effectiveMonthlyLimit: number
  canCustomizeLimits: boolean
}

export interface UpsertTenantTranscriptionConfigInput {
  planId: number
  customMonthlyLimit?: number | null
  overageAllowed?: boolean
}

export const tenantTranscriptionConfigService = {
  /**
   * Get tenant transcription configuration
   */
  async getConfig(tenantId: number) {
    const response = await api.get(`/internal/api/v1/tenants/${tenantId}/transcription-config`)
    return response.data as TenantTranscriptionConfig
  },

  /**
   * Create or update tenant transcription configuration
   */
  async upsertConfig(tenantId: number, input: UpsertTenantTranscriptionConfigInput) {
    const response = await api.put(`/internal/api/v1/tenants/${tenantId}/transcription-config`, input)
    return response.data as TenantTranscriptionConfig
  }
}
