import { api } from '@client/config/http'

export interface TranscriptionPlan {
  id: number
  slug: string
  name: string
  monthlyMinutesLimit: number
  allowsCustomLimits: boolean
  allowsOverage: boolean
  sttModel: string
  languageDetectionEnabled: boolean
  costPerMinuteUsd: number
  active: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTranscriptionPlanInput {
  slug: string
  name: string
  monthlyMinutesLimit: number
  allowsCustomLimits: boolean
  allowsOverage: boolean
  sttModel: string
  languageDetectionEnabled: boolean
  costPerMinuteUsd: number
  active: boolean
  description?: string
}

export interface UpdateTranscriptionPlanInput {
  slug?: string
  name?: string
  monthlyMinutesLimit?: number
  allowsCustomLimits?: boolean
  allowsOverage?: boolean
  sttModel?: string
  languageDetectionEnabled?: boolean
  costPerMinuteUsd?: number
  active?: boolean
  description?: string
}

export const transcriptionPlansService = {
  /**
   * List all transcription plans
   */
  async getPlans(params?: { active?: boolean; limit?: number; offset?: number }) {
    const response = await api.get('/internal/api/v1/transcription-plans', { params })
    return {
      plans: response.data.plans as TranscriptionPlan[],
      pagination: response.data.pagination
    }
  },

  /**
   * Get transcription plan by ID
   */
  async getPlanById(id: number) {
    const response = await api.get(`/internal/api/v1/transcription-plans/${id}`)
    return response.data as TranscriptionPlan
  },

  /**
   * Create new transcription plan
   */
  async createPlan(input: CreateTranscriptionPlanInput) {
    const response = await api.post('/internal/api/v1/transcription-plans', input)
    return response.data as TranscriptionPlan
  },

  /**
   * Update transcription plan
   */
  async updatePlan(id: number, input: UpdateTranscriptionPlanInput) {
    const response = await api.put(`/internal/api/v1/transcription-plans/${id}`, input)
    return response.data as TranscriptionPlan
  },

  /**
   * Soft delete transcription plan (set active = false)
   */
  async deletePlan(id: number) {
    await api.delete(`/internal/api/v1/transcription-plans/${id}`)
  }
}
