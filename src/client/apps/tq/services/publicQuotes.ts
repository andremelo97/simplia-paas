import { api } from '@client/config/http'

// Template interfaces
export interface PublicQuoteTemplate {
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
  data: PublicQuoteTemplate[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

// Public Quote interfaces
export interface PublicQuote {
  id: string
  createdAt: string
  updatedAt: string
  quoteId: string
  templateId?: string
  accessToken: string
  viewsCount: number
  lastViewedAt?: string
  active: boolean
  expiresAt?: string
  hasPassword: boolean
  isExpired: boolean
  isAccessible: boolean
  quote?: {
    id: string
    number: string
    content?: string
    total: number
    status: string
    sessionId: string
  }
  template?: {
    id: string
    name: string
    content: Record<string, any>
  }
  patient?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  }
}

export interface CreatePublicQuoteRequest {
  quoteId: string
  templateId?: string
  password?: string
  expiresAt?: string
}

export const publicQuotesService = {
  // Templates
  async listTemplates(params: { limit?: number; offset?: number; active?: boolean; isDefault?: boolean } = {}): Promise<TemplateListResponse> {
    const queryParams = new URLSearchParams()
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.active !== undefined) queryParams.append('active', params.active.toString())
    if (params.isDefault !== undefined) queryParams.append('isDefault', params.isDefault.toString())

    const url = `/api/tq/v1/public-quote-templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)
    // Response from API is {data: [...], meta: {...}}
    return response
  },

  async getTemplate(id: string): Promise<PublicQuoteTemplate> {
    const response = await api.get(`/api/tq/v1/public-quote-templates/${id}`)
    return response.data || response
  },

  async createTemplate(data: CreateTemplateRequest): Promise<PublicQuoteTemplate> {
    const response = await api.post('/api/tq/v1/public-quote-templates', data)
    return response.data || response
  },

  async updateTemplate(id: string, data: Partial<CreateTemplateRequest>): Promise<PublicQuoteTemplate> {
    const response = await api.put(`/api/tq/v1/public-quote-templates/${id}`, data)
    return response.data || response
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/public-quote-templates/${id}`)
  },

  // Public Quotes
  async createPublicQuote(data: CreatePublicQuoteRequest): Promise<PublicQuote> {
    const response = await api.post('/api/tq/v1/public-quotes', data)
    return response.data.data
  },

  async getPublicQuotesByQuote(quoteId: string): Promise<PublicQuote[]> {
    const response = await api.get(`/api/tq/v1/public-quotes/by-quote/${quoteId}`)
    return response.data.data
  },

  async revokePublicQuote(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/public-quotes/${id}`)
  }
}
