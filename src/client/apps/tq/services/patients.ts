import { api } from '@client/config/http'

export interface Patient {
  id: string // Mudando para string pois a API usa UUIDs
  first_name: string
  last_name: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

// Interface para a resposta da API (camelCase)
interface ApiPatient {
  id: string
  firstName: string
  lastName?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  data: ApiPatient[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export interface CreatePatientRequest {
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  notes?: string
}

export interface PatientsListParams {
  offset?: number
  limit?: number
  q?: string
}

export interface PatientsListResponse {
  data: Patient[]
  total: number
}

export const patientsService = {
  async list(params: PatientsListParams = {}): Promise<PatientsListResponse> {
    const queryParams = new URLSearchParams()
    // Não enviamos limit/offset - queremos todos os registros
    // API sempre retorna em ordem alfabética por padrão
    if (params.q) queryParams.append('search', params.q)  // API expects 'search', not 'q'

    console.log('🔍 [Patients Service] Search params:', params)
    console.log('🔍 [Patients Service] Query URL:', `/api/tq/v1/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`)

    const url = `/api/tq/v1/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)

    const apiResponse = response.data

    let patientsData: ApiPatient[]
    let total: number

    // API retorna todos os registros como array direto
    if (Array.isArray(apiResponse)) {
      patientsData = apiResponse
      total = apiResponse.length
    } else {
      console.error('❌ [Patients Service] Invalid API response structure:', apiResponse)
      throw new Error('Invalid API response structure')
    }

    // Mapear dados da API para o formato esperado
    const mappedPatients: Patient[] = patientsData.map(apiPatient => ({
      id: apiPatient.id, // Manter como string (UUID)
      first_name: apiPatient.firstName,
      last_name: apiPatient.lastName || null,
      email: apiPatient.email || null,
      phone: apiPatient.phone || null,
      notes: apiPatient.notes || null,
      created_at: apiPatient.createdAt,
      updated_at: apiPatient.updatedAt
    }))


    return {
      data: mappedPatients,
      total
    }
  },

  async searchPatients(params: { search?: string; limit?: number } = {}): Promise<Patient[]> {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const url = `/api/tq/v1/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    return response.data
  },

  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    // Transform snake_case to camelCase for API
    const apiData = {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      notes: data.notes
    }

    console.log('🔄 [Patients Service] Sending data to API:', apiData)
    const response = await api.post('/api/tq/v1/patients', apiData)
    console.log('✅ [Patients Service] API Response:', response.data)
    console.log('🔍 [Patients Service] Full response structure:', JSON.stringify(response.data, null, 2))

    if (!response.data) {
      throw new Error('Invalid API response structure for create patient')
    }

    // The API returns patient data directly in response.data (same as GET/PUT)
    const apiPatient = response.data
    console.log('🔍 [Patients Service] Created patient data:', apiPatient)

    // Map camelCase response to snake_case frontend format
    const mappedPatient: Patient = {
      id: apiPatient.id,
      first_name: apiPatient.firstName || apiPatient.first_name || '',
      last_name: apiPatient.lastName || apiPatient.last_name || '',
      email: apiPatient.email || null,
      phone: apiPatient.phone || null,
      notes: apiPatient.notes || null,
      created_at: apiPatient.createdAt || apiPatient.created_at,
      updated_at: apiPatient.updatedAt || apiPatient.updated_at
    }

    console.log('✅ [Patients Service] Mapped created patient:', mappedPatient)
    return mappedPatient
  },

  async getPatient(id: string): Promise<Patient> {
    console.log('🔍 [Patients Service] Fetching patient:', id)
    const response = await api.get(`/api/tq/v1/patients/${id}`)
    console.log('🔍 [Patients Service] API Response:', response.data)
    console.log('🔍 [Patients Service] Full response structure:', JSON.stringify(response.data, null, 2))

    // Check if response has the expected structure
    if (!response.data) {
      throw new Error('No data received from API')
    }

    // The API returns patient data directly in response.data
    const apiPatient = response.data
    console.log('🔍 [Patients Service] API Patient data:', apiPatient)

    if (!apiPatient || !apiPatient.id) {
      throw new Error('Patient data is invalid in API response')
    }

    // Map camelCase response to snake_case frontend format
    const mappedPatient: Patient = {
      id: apiPatient.id,
      first_name: apiPatient.firstName || apiPatient.first_name || '',
      last_name: apiPatient.lastName || apiPatient.last_name || '',
      email: apiPatient.email || null,
      phone: apiPatient.phone || null,
      notes: apiPatient.notes || null,
      created_at: apiPatient.createdAt || apiPatient.created_at,
      updated_at: apiPatient.updatedAt || apiPatient.updated_at
    }

    console.log('✅ [Patients Service] Mapped patient:', mappedPatient)
    return mappedPatient
  },

  async updatePatient(id: string, data: Partial<CreatePatientRequest>): Promise<Patient> {
    // Transform snake_case to camelCase for API
    const apiData: any = {}
    if (data.first_name !== undefined) apiData.firstName = data.first_name
    if (data.last_name !== undefined) apiData.lastName = data.last_name
    if (data.email !== undefined) apiData.email = data.email
    if (data.phone !== undefined) apiData.phone = data.phone
    if (data.notes !== undefined) apiData.notes = data.notes

    console.log('🔄 [Patients Service] Updating patient data:', apiData)
    const response = await api.put(`/api/tq/v1/patients/${id}`, apiData)
    console.log('✅ [Patients Service] Update API Response:', response.data)
    console.log('🔍 [Patients Service] Full response structure:', JSON.stringify(response.data, null, 2))

    if (!response.data) {
      throw new Error('Invalid API response structure for update patient')
    }

    // The API returns patient data directly in response.data (same as GET)
    const apiPatient = response.data
    console.log('🔍 [Patients Service] Updated patient data:', apiPatient)

    // Map camelCase response to snake_case frontend format
    const mappedPatient: Patient = {
      id: apiPatient.id,
      first_name: apiPatient.firstName || apiPatient.first_name || '',
      last_name: apiPatient.lastName || apiPatient.last_name || '',
      email: apiPatient.email || null,
      phone: apiPatient.phone || null,
      notes: apiPatient.notes || null,
      created_at: apiPatient.createdAt || apiPatient.created_at,
      updated_at: apiPatient.updatedAt || apiPatient.updated_at
    }

    console.log('✅ [Patients Service] Mapped updated patient:', mappedPatient)
    return mappedPatient
  },

  async deletePatient(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/patients/${id}`)
  }
}