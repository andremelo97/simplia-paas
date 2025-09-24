import { api } from '@client/config/http'

export interface Session {
  id: number
  status: 'draft' | 'active' | 'completed'
  patientId?: number
  patient?: {
    id: number
    name: string
    email?: string
    phone?: string
  }
  transcription: string
  duration: number
  createdAt: string
  updatedAt: string
}

export interface CreateSessionRequest {
  patientId?: number
  transcription?: string
}

export interface UpdateSessionRequest {
  status?: 'draft' | 'active' | 'completed'
  patientId?: number
  transcription?: string
  duration?: number
}

export const sessionsService = {
  async createSession(data: CreateSessionRequest = {}): Promise<Session> {
    const response = await api.post('/api/tq/v1/sessions', data)
    return response.data
  },

  async updateSession(id: number, data: UpdateSessionRequest): Promise<Session> {
    const response = await api.put(`/api/tq/v1/sessions/${id}`, data)
    return response.data
  },

  async getSession(id: number): Promise<Session> {
    const response = await api.get(`/api/tq/v1/sessions/${id}`)
    return response.data
  },

  async deleteSession(id: number): Promise<void> {
    await api.delete(`/api/tq/v1/sessions/${id}`)
  },

  async getSessions(): Promise<Session[]> {
    const response = await api.get('/api/tq/v1/sessions')
    return response.data
  }
}