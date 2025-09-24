import { api } from '@client/config/http'

export interface Patient {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePatientRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  notes?: string
}

export interface SearchPatientsParams {
  search?: string
  limit?: number
}

export const patientsService = {
  async searchPatients(params: SearchPatientsParams = {}): Promise<Patient[]> {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const url = `/api/tq/v1/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    return response.data
  },

  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    const response = await api.post('/api/tq/v1/patients', data)
    return response.data
  },

  async getPatient(id: number): Promise<Patient> {
    const response = await api.get(`/api/tq/v1/patients/${id}`)
    return response.data
  },

  async updatePatient(id: number, data: Partial<CreatePatientRequest>): Promise<Patient> {
    const response = await api.put(`/api/tq/v1/patients/${id}`, data)
    return response.data
  },

  async deletePatient(id: number): Promise<void> {
    await api.delete(`/api/tq/v1/patients/${id}`)
  }
}