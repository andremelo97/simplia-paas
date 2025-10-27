import { api } from '@client/config/http'
import { useAuthStore } from '../store/auth'

// Usage data structures
interface UsageDataPoint {
  month: string  // YYYY-MM format
  minutesUsed: number
  limit: number
  overage: number
}

interface CurrentUsage {
  month: string
  minutesUsed: number
  limit: number
  remaining: number
  overage: number
  overageAllowed: boolean
  percentUsed: number
}

interface TranscriptionUsageResponse {
  data: {
    current: CurrentUsage
    history: UsageDataPoint[]
    plan: {
      slug: string
      name: string
      allowsCustomLimits: boolean
      allowsOverage: boolean
      languageDetectionEnabled: boolean
    }
    config: {
      customMonthlyLimit: number | null
      transcriptionLanguage: string | null
      overageAllowed: boolean
    }
  }
  meta: {
    code: string
  }
}

// Configuration structures
interface TranscriptionConfig {
  planId: number
  customMonthlyLimit: number | null
  overageAllowed: boolean
  enabled: boolean
}

interface TranscriptionConfigResponse {
  data: {
    id: number
    tenantId: number
    planId: number
    customMonthlyLimit: number | null
    overageAllowed: boolean
    enabled: boolean
    plan: {
      slug: string
      name: string
      monthlyMinutesLimit: number
      allowsCustomLimits: boolean
    }
    effectiveMonthlyLimit: number
    canCustomizeLimits: boolean
  }
  meta: {
    code: string
  }
}

class TranscriptionUsageService {
  /**
   * Get transcription usage for current user's tenant
   * Fetches current month usage, 6-month history, and plan details
   */
  async getUsage(): Promise<TranscriptionUsageResponse['data']> {
    const { tenantId } = useAuthStore.getState()

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.get('/internal/api/v1/configurations/transcription-usage')

    return response.data
  }

  /**
   * Get transcription configuration for current user's tenant
   * Returns plan details and custom limits (if VIP)
   */
  async getConfig(): Promise<TranscriptionConfigResponse> {
    const { tenantId } = useAuthStore.getState()

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.get('/internal/api/v1/configurations/transcription-config')

    return response.data.data
  }

  /**
   * Update transcription configuration (VIP only)
   * Allows customizing monthly limits (minimum 2400 minutes)
   */
  async updateConfig(config: Partial<TranscriptionConfig>): Promise<TranscriptionConfigResponse> {
    const { tenantId } = useAuthStore.getState()

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.put('/internal/api/v1/configurations/transcription-config', config)

    return response.data.data
  }

  /**
   * Get detailed transcription usage records (granular)
   * Returns per-transcription records with pagination
   */
  async getUsageDetails(limit: number = 10, offset: number = 0): Promise<any> {
    const { tenantId } = useAuthStore.getState()

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.get('/internal/api/v1/configurations/transcription-usage/details', {
      params: { limit, offset }
    })

    // Return complete response with data and meta (don't unwrap)
    return response
  }
}

export const transcriptionUsageService = new TranscriptionUsageService()
