import { api } from '@client/config/http'

export interface Patient {
  id: number
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePatientRequest {
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
}

export interface SearchPatientsParams {
  search?: string
  limit?: number
}

export const patientsService = {
  async searchPatients(params: SearchPatientsParams = {}): Promise<Patient[]> {
    const response = await api.get('/api/tq/v1/patients', { params })
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