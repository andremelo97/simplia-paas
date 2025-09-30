import { api } from '@client/config/http'

export interface Item {
  id: string
  name: string
  description?: string
  basePrice: number | string // API returns string with 2 decimals (e.g., "250.50")
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateItemRequest {
  name: string
  description?: string
  basePrice: number
  active: boolean
}

export interface ItemsListParams {
  page?: number
  pageSize?: number
  query?: string
  activeOnly?: boolean
}

export interface ItemsListResponse {
  data: Item[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export const itemsService = {
  async list(params: ItemsListParams = {}): Promise<ItemsListResponse> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.query) queryParams.append('query', params.query)
    if (params.activeOnly !== undefined) queryParams.append('activeOnly', params.activeOnly.toString())

    const url = `/api/tq/v1/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)

    // Backend returns { data: [...], pagination: {...} }
    return response
  },

  async getItem(id: string): Promise<Item> {
    const response = await api.get(`/api/tq/v1/items/${id}`)
    // Backend returns item directly (not wrapped in data)
    return response
  },

  async getById(id: string): Promise<Item> {
    const response = await api.get(`/api/tq/v1/items/${id}`)
    // Backend returns item directly (not wrapped in data)
    return response
  },

  async create(data: CreateItemRequest): Promise<Item> {
    const response = await api.post('/api/tq/v1/items', data)
    return response
  },

  async update(id: string, data: CreateItemRequest): Promise<Item> {
    const response = await api.put(`/api/tq/v1/items/${id}`, data)
    return response
  }
}