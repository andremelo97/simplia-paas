import { api } from '@client/config/http'

export interface Session {
  id: string // UUID
  number: string // SES000001, SES000002, etc
  patient_id: string
  transcription_id?: string | null
  status: string // 'draft', etc
  created_at: string
  updated_at: string
  // Patient data when includePatient=true
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
  // Transcription data when available
  transcription_text?: string
  transcription_confidence?: number
}

// Interface para a resposta da API (camelCase)
interface ApiSession {
  id: string
  number: string
  patientId: string
  transcriptionId?: string | null
  status: string
  createdAt: string
  updatedAt: string
  // Patient data when includePatient=true (API returns snake_case for joined data)
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
  // Transcription data when available (API returns snake_case for joined data)
  transcription_text?: string
  transcription_confidence?: number
}

export interface SessionsListParams {
  offset?: number
  limit?: number
  q?: string
}

export interface SessionsListResponse {
  data: Session[]
  total: number
}

export interface CreateSessionRequest {
  patient_id: string
  transcription_id?: string | null
  status?: string
}

export interface UpdateSessionRequest {
  status?: string
  transcription_id?: string | null
  transcription_text?: string
}

export const sessionsService = {
  async list(params: SessionsListParams = {}): Promise<SessionsListResponse> {
    const queryParams = new URLSearchParams()
    if (params.q) queryParams.append('search', params.q)
    // Always include patient data
    queryParams.append('includePatient', 'true')

    console.log('🔍 [Sessions Service] Search params:', params)
    console.log('🔍 [Sessions Service] Query URL:', `/api/tq/v1/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)

    const url = `/api/tq/v1/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)

    const apiResponse = response.data

    let sessionsData: ApiSession[]
    let total: number

    // API retorna todos os registros como array direto
    if (Array.isArray(apiResponse)) {
      sessionsData = apiResponse
      total = apiResponse.length
    } else {
      console.error('❌ [Sessions Service] Invalid API response structure:', apiResponse)
      throw new Error('Invalid API response structure')
    }

    // Mapear dados da API para o formato esperado
    const mappedSessions: Session[] = sessionsData.map(apiSession => ({
      id: apiSession.id,
      number: apiSession.number,
      patient_id: apiSession.patientId,
      transcription_id: apiSession.transcriptionId || null,
      status: apiSession.status,
      created_at: apiSession.createdAt,
      updated_at: apiSession.updatedAt,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiSession.patient_first_name,
      patient_last_name: apiSession.patient_last_name,
      patient_email: apiSession.patient_email,
      // Transcription data (API returns snake_case for joined data)
      transcription_text: apiSession.transcription_text,
      transcription_confidence: apiSession.transcription_confidence
    }))

    return {
      data: mappedSessions,
      total
    }
  },

  async getSession(id: string): Promise<Session> {
    console.log('🔍 [Sessions Service] Fetching session:', id)
    const response = await api.get(`/api/tq/v1/sessions/${id}?includePatient=true`)
    console.log('🔍 [Sessions Service] API Response:', response.data)

    if (!response.data) {
      throw new Error('No data received from API')
    }

    const apiSession = response.data

    if (!apiSession || !apiSession.id) {
      throw new Error('Session data is invalid in API response')
    }

    // Map camelCase response to snake_case frontend format
    const mappedSession: Session = {
      id: apiSession.id,
      number: apiSession.number,
      patient_id: apiSession.patientId,
      transcription_id: apiSession.transcriptionId || null,
      status: apiSession.status,
      created_at: apiSession.createdAt,
      updated_at: apiSession.updatedAt,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiSession.patient_first_name,
      patient_last_name: apiSession.patient_last_name,
      patient_email: apiSession.patient_email,
      // Transcription data (API returns snake_case for joined data)
      transcription_text: apiSession.transcription_text,
      transcription_confidence: apiSession.transcription_confidence
    }

    console.log('✅ [Sessions Service] Mapped session:', mappedSession)
    return mappedSession
  },

  async createSession(data: CreateSessionRequest): Promise<Session> {
    // Transform snake_case to camelCase for API
    const apiData = {
      patientId: data.patient_id,
      transcriptionId: data.transcription_id,
      status: data.status
    }

    console.log('🔄 [Sessions Service] Sending data to API:', apiData)
    const response = await api.post('/api/tq/v1/sessions', apiData)
    console.log('✅ [Sessions Service] API Response:', response.data)

    if (!response.data) {
      throw new Error('Invalid API response structure for create session')
    }

    // The API returns session data directly in response.data
    const apiSession = response.data

    // Map camelCase response to snake_case frontend format
    const mappedSession: Session = {
      id: apiSession.id,
      number: apiSession.number,
      patient_id: apiSession.patientId,
      transcription_id: apiSession.transcriptionId || null,
      status: apiSession.status,
      created_at: apiSession.createdAt,
      updated_at: apiSession.updatedAt,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiSession.patient_first_name,
      patient_last_name: apiSession.patient_last_name,
      patient_email: apiSession.patient_email,
      // Transcription data (API returns snake_case for joined data)
      transcription_text: apiSession.transcription_text,
      transcription_confidence: apiSession.transcription_confidence
    }

    console.log('✅ [Sessions Service] Mapped created session:', mappedSession)
    return mappedSession
  },

  async updateSession(id: string, data: UpdateSessionRequest): Promise<Session> {
    // Transform snake_case to camelCase for API
    const apiData: any = {}
    if (data.status !== undefined) apiData.status = data.status
    if (data.transcription_id !== undefined) apiData.transcriptionId = data.transcription_id
    if (data.transcription_text !== undefined) apiData.transcriptionText = data.transcription_text

    console.log('🔄 [Sessions Service] Updating session:', apiData)
    const response = await api.put(`/api/tq/v1/sessions/${id}`, apiData)
    console.log('✅ [Sessions Service] Update response:', response.data)

    if (!response.data) {
      throw new Error('Invalid API response structure for update session')
    }

    // The API returns session data directly in response.data
    const apiSession = response.data

    // Map camelCase response to snake_case frontend format
    const mappedSession: Session = {
      id: apiSession.id,
      number: apiSession.number,
      patient_id: apiSession.patientId,
      transcription_id: apiSession.transcriptionId || null,
      status: apiSession.status,
      created_at: apiSession.createdAt,
      updated_at: apiSession.updatedAt,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiSession.patient_first_name,
      patient_last_name: apiSession.patient_last_name,
      patient_email: apiSession.patient_email,
      // Transcription data (API returns snake_case for joined data)
      transcription_text: apiSession.transcription_text,
      transcription_confidence: apiSession.transcription_confidence
    }

    console.log('✅ [Sessions Service] Mapped updated session:', mappedSession)
    return mappedSession
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/sessions/${id}`)
  },

  async getAudioDownloadUrl(id: string): Promise<{ data: { downloadUrl: string; filename: string; expiresAt: string | null } }> {
    return await api.get(`/api/tq/v1/sessions/${id}/audio-download`)
  }
}