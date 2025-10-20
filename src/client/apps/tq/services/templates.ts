import { api } from '@client/config/http'

export interface Template {
  id: string
  title: string
  content: string
  description?: string | null
  active: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

// Interface para a resposta da API (camelCase)
interface ApiTemplate {
  id: string
  title: string
  content: string
  description?: string | null
  active: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  data: ApiTemplate[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

export interface CreateTemplateRequest {
  title: string
  content: string
  description?: string
  active?: boolean
}

export interface UpdateTemplateRequest {
  title?: string
  content?: string
  description?: string
  active?: boolean
}

export interface GetTemplatesParams {
  limit?: number
  offset?: number
  active?: boolean
  search?: string
}

// Função para converter de camelCase para snake_case (se necessário)
const convertToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase)
  }

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    converted[snakeKey] = convertToSnakeCase(value)
  }
  return converted
}

// Função para converter de snake_case para camelCase
const convertToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertToCamelCase)
  }

  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    converted[camelKey] = convertToCamelCase(value)
  }
  return converted
}

export const templatesService = {
  /**
   * Get all templates with optional filtering and pagination
   */
  async getAll(params: GetTemplatesParams = {}): Promise<{ templates: Template[], total: number, limit: number, offset: number }> {
    const response = await api.get('/api/tq/v1/templates', { params })

    // Handle both possible response formats
    let data, meta;

    if (Array.isArray(response.data)) {
      // API returns array directly (current TQ API format)
      data = response.data;
      meta = { total: response.data.length, limit: 50, offset: 0 };
    } else {
      // API returns object with data/meta properties
      data = response.data.data || response.data.templates || [];
      meta = response.data.meta || response.data;
    }

    return {
      templates: data.map(convertToCamelCase),
      total: meta.total || 0,
      limit: meta.limit || 50,
      offset: meta.offset || 0
    }
  },

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<Template> {
    const response = await api.get<{ data: ApiTemplate }>(`/api/tq/v1/templates/${id}`)
    return convertToCamelCase(response.data.data || response.data)
  },

  /**
   * Create a new template
   */
  async create(data: CreateTemplateRequest): Promise<Template> {
    const snakeCaseData = convertToSnakeCase(data)
    const response = await api.post<{ data: ApiTemplate }>('/api/tq/v1/templates', snakeCaseData)
    return convertToCamelCase(response.data.data)
  },

  /**
   * Update an existing template
   */
  async update(id: string, data: UpdateTemplateRequest): Promise<Template> {
    const snakeCaseData = convertToSnakeCase(data)
    const response = await api.put<{ data: ApiTemplate }>(`/api/tq/v1/templates/${id}`, snakeCaseData)
    return convertToCamelCase(response.data.data)
  },

  /**
   * Delete a template
   */
  async delete(id: string): Promise<Template> {
    const response = await api.delete<{ data: ApiTemplate }>(`/api/tq/v1/templates/${id}`)
    return convertToCamelCase(response.data.data)
  },

  /**
   * Delete a template (alias for delete)
   */
  async deleteTemplate(id: string): Promise<Template> {
    return this.delete(id)
  },

  /**
   * Get most used templates
   */
  async getMostUsed(limit: number = 10): Promise<Template[]> {
    const response = await api.get('/api/tq/v1/templates/most-used', {
      params: { limit }
    })
    return response.data ? response.data.map(convertToCamelCase) : response.map(convertToCamelCase)
  },

  /**
   * Increment usage count for a template
   * (This will be called by the AI agent when filling a template)
   */
  async incrementUsage(id: string): Promise<Template> {
    const response = await api.post<ApiTemplate>(`/api/tq/v1/templates/${id}/increment-usage`)
    return convertToCamelCase(response.data)
  }
}