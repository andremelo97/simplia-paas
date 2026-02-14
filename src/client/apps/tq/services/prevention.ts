import { api } from '@client/config/http'

export interface CreatedByUser {
  id: number
  firstName: string
  lastName: string
}

export interface Prevention {
  id: string // UUID
  number: string // PRV000001, PRV000002, etc
  sessionId: string
  content: string
  status: 'draft' | 'sent' | 'viewed'
  createdAt: string
  updatedAt: string
  // Creator data
  createdBy?: CreatedByUser
  // Session data when joined
  session_number?: string
  session_status?: string
  // Patient data when joined
  patient_id?: string
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
  patient_phone?: string
}

export interface PreventionListParams {
  offset?: number
  limit?: number
  sessionId?: string
  status?: 'draft' | 'sent' | 'viewed'
  created_from?: string
  created_to?: string
  patient_id?: string
  created_by_user_id?: number
}

export interface PreventionListResponse {
  data: Prevention[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export interface CreatePreventionRequest {
  sessionId: string
  content?: string
  status?: 'draft' | 'sent' | 'viewed'
}

export interface UpdatePreventionRequest {
  content?: string
  status?: 'draft' | 'sent' | 'viewed'
}

export const preventionService = {
  async list(params: PreventionListParams = {}): Promise<PreventionListResponse> {
    const queryParams = new URLSearchParams()
    if (params.sessionId) queryParams.append('sessionId', params.sessionId)
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.created_from) queryParams.append('created_from', params.created_from)
    if (params.created_to) queryParams.append('created_to', params.created_to)
    if (params.patient_id) queryParams.append('patient_id', params.patient_id)
    if (params.created_by_user_id) queryParams.append('created_by_user_id', params.created_by_user_id.toString())

    const url = `/api/tq/v1/prevention${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)

    // Backend returns: { data: [...], meta: {...} }
    return {
      data: response.data.data || response.data,
      meta: response.data.meta || { total: 0, limit: 50, offset: 0 }
    }
  },

  async getById(id: string): Promise<Prevention> {
    const response = await api.get(`/api/tq/v1/prevention/${id}`)
    return response.data.data || response.data
  },

  async create(data: CreatePreventionRequest): Promise<Prevention> {
    const response = await api.post('/api/tq/v1/prevention', data)
    return response.data.data || response.data
  },

  async update(id: string, data: UpdatePreventionRequest): Promise<Prevention> {
    const response = await api.put(`/api/tq/v1/prevention/${id}`, data)
    return response.data.data || response.data
  }
}
