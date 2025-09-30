import { api } from '@client/config/http'

export interface ClinicalReport {
  id: string // UUID
  number: string // CLR000001, CLR000002, etc
  session_id: string
  content: string
  created_at: string
  updated_at: string
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

export interface ClinicalReportsListParams {
  offset?: number
  limit?: number
  sessionId?: string
}

export interface ClinicalReportsListResponse {
  data: ClinicalReport[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export interface CreateClinicalReportRequest {
  sessionId: string
  content: string
}

export interface UpdateClinicalReportRequest {
  content?: string
}

export const clinicalReportsService = {
  async list(params: ClinicalReportsListParams = {}): Promise<ClinicalReportsListResponse> {
    const queryParams = new URLSearchParams()
    if (params.sessionId) queryParams.append('sessionId', params.sessionId)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())

    const url = `/api/tq/v1/clinical-reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)

    // Backend returns: { data: [...], meta: {...} }
    // We need to return in the expected format
    return {
      data: response.data.data || response.data,
      meta: response.data.meta || { total: 0, limit: 50, offset: 0 }
    }
  },

  async getById(id: string): Promise<ClinicalReport> {
    const response = await api.get(`/api/tq/v1/clinical-reports/${id}`)
    // Defensive: handle both response.data.data and response.data formats
    return response.data.data || response.data
  },

  async create(data: CreateClinicalReportRequest): Promise<ClinicalReport> {
    const response = await api.post('/api/tq/v1/clinical-reports', data)
    // Defensive: handle both response.data.data and response.data formats
    return response.data.data || response.data
  },

  async update(id: string, data: UpdateClinicalReportRequest): Promise<ClinicalReport> {
    const response = await api.put(`/api/tq/v1/clinical-reports/${id}`, data)
    // Defensive: handle both response.data.data and response.data formats
    return response.data.data || response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/clinical-reports/${id}`)
  }
}
