import { api } from '@client/config/http'

// Template interfaces
export interface LandingPageTemplate {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  description?: string
  content: Record<string, any>
  isDefault: boolean
  active: boolean
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  content: Record<string, any>
  isDefault?: boolean
  active?: boolean
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  content?: Record<string, any>
  isDefault?: boolean
  active?: boolean
}

export interface TemplateListResponse {
  data: LandingPageTemplate[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

// Landing Page interfaces
export interface LandingPage {
  id: string
  createdAt: string
  updatedAt: string
  tenantId: number
  documentId: string
  documentType: 'quote' | 'prevention'
  templateId?: string
  accessToken: string
  publicUrl?: string
  viewsCount: number
  lastViewedAt?: string
  active: boolean
  expiresAt?: string
  hasPassword: boolean
  password?: string | null
  isExpired: boolean
  isAccessible: boolean
  quote?: {
    id: string
    number: string
    content?: string
    total: number
    status: string
    sessionId: string
    patient?: {
      id: string
      firstName: string
      lastName: string
      email?: string
      phone?: string
      phoneCountryCode?: string
    }
  }
  prevention?: {
    id: string
    number: string
    content?: string
    status: string
    sessionId: string
    patient?: {
      id: string
      firstName: string
      lastName: string
      email?: string
      phone?: string
      phoneCountryCode?: string
    }
  }
  template?: {
    id: string
    name: string
    content: Record<string, any>
  }
}

export interface CreateLandingPageRequest {
  documentId: string
  documentType?: 'quote' | 'prevention'
  templateId?: string
  password?: string
  expiresAt?: string
  tenantId: number
}

export const landingPagesService = {
  // Templates
  async listTemplates(params: { limit?: number; offset?: number; active?: boolean; isDefault?: boolean } = {}): Promise<TemplateListResponse> {
    const queryParams = new URLSearchParams()
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.active !== undefined) queryParams.append('active', params.active.toString())
    if (params.isDefault !== undefined) queryParams.append('isDefault', params.isDefault.toString())

    const url = `/api/tq/v1/landing-page-templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    // Response from API is {data: [...], meta: {...}}
    return response
  },

  async getTemplate(id: string): Promise<LandingPageTemplate> {
    const response = await api.get(`/api/tq/v1/landing-page-templates/${id}`)
    return response.data || response
  },

  async createTemplate(data: CreateTemplateRequest): Promise<LandingPageTemplate> {
    const response = await api.post('/api/tq/v1/landing-page-templates', data)
    return response.data || response
  },

  async updateTemplate(id: string, data: Partial<CreateTemplateRequest>): Promise<LandingPageTemplate> {
    const response = await api.put(`/api/tq/v1/landing-page-templates/${id}`, data)
    return response.data || response
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/landing-page-templates/${id}`)
  },

  // Landing Pages
  async createLandingPage(data: CreateLandingPageRequest): Promise<LandingPage> {
    const response = await api.post('/api/tq/v1/landing-pages', data)
    return response.data.data
  },

  async listAllLandingPages(filters?: {
    active?: boolean
    document_type?: 'quote' | 'prevention'
    created_from?: string
    created_to?: string
  }): Promise<LandingPage[]> {
    const queryParams = new URLSearchParams()

    if (filters?.active !== undefined) {
      queryParams.append('active', filters.active.toString())
    }
    if (filters?.document_type) {
      queryParams.append('document_type', filters.document_type)
    }
    if (filters?.created_from) {
      queryParams.append('created_from', filters.created_from)
    }
    if (filters?.created_to) {
      queryParams.append('created_to', filters.created_to)
    }

    const url = `/api/tq/v1/landing-pages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    // Response structure: { data: [...] }
    // The api client already parses response.json(), so response.data IS the array
    return Array.isArray(response.data) ? response.data : (response.data?.data || [])
  },

  async getLandingPagePreview(id: string): Promise<{ content: any; branding: any }> {
    const response = await api.get(`/api/tq/v1/landing-pages/link/${id}`)
    return response.data
  },

  async getLandingPagesByDocument(documentId: string, documentType: 'quote' | 'prevention' = 'quote'): Promise<LandingPage[]> {
    const response = await api.get(`/api/tq/v1/landing-pages/${documentId}?document_type=${documentType}`)
    return Array.isArray(response.data) ? response.data : (response.data?.data || [])
  },

  async revokeLandingPage(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/landing-pages/${id}`)
  },

  async generateNewPassword(id: string): Promise<{ publicUrl: string; password: string }> {
    const response = await api.post(`/api/tq/v1/landing-pages/${id}/new-password`)
    return {
      publicUrl: response.data.publicUrl,
      password: response.meta.password
    }
  },

  async sendEmail(landingPageId: string): Promise<void> {
    await api.post(`/api/tq/v1/landing-pages/${landingPageId}/send-email`)
  }
}
