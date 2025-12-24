import { api } from '@client/config/http'

export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
  completedAt: string | null
  skippedAt: string | null
}

export interface OnboardingStatusMap {
  [appSlug: string]: OnboardingStatus
}

export interface OnboardingRecord {
  id: number
  userId: number
  appSlug: string
  completed: boolean
  completedAt: string | null
  skipped: boolean
  skippedAt: string | null
  createdAt: string
}

export interface NeedsOnboardingResponse {
  needsOnboarding: boolean
  reason?: string
}

class OnboardingService {
  private baseUrl = '/internal/api/v1/onboarding'

  /**
   * Get onboarding status for all apps
   */
  async getStatus(): Promise<OnboardingStatusMap> {
    const response = await api.get(this.baseUrl + '/status')
    return response.data
  }

  /**
   * Check if user needs onboarding for a specific app
   */
  async needsOnboarding(appSlug: 'hub' | 'tq'): Promise<NeedsOnboardingResponse> {
    const response = await api.get(`${this.baseUrl}/${appSlug}/needs`)
    return response.data
  }

  /**
   * Mark onboarding as completed for an app
   */
  async complete(appSlug: 'hub' | 'tq'): Promise<OnboardingRecord> {
    const response = await api.post(`${this.baseUrl}/${appSlug}/complete`)
    return response.data
  }

  /**
   * Mark onboarding as skipped for an app
   */
  async skip(appSlug: 'hub' | 'tq'): Promise<OnboardingRecord> {
    const response = await api.post(`${this.baseUrl}/${appSlug}/skip`)
    return response.data
  }

  /**
   * Reset onboarding for an app (allows re-running wizard)
   */
  async reset(appSlug: 'hub' | 'tq'): Promise<void> {
    await api.post(`${this.baseUrl}/${appSlug}/reset`)
  }
}

export const onboardingService = new OnboardingService()
