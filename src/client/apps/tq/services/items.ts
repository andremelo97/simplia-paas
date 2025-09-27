import { api } from '@client/config/http'

export interface Item {
  id: string
  name: string
  description?: string
  base_price: number
  active: boolean
  created_at: string
  updated_at: string
}

// Interface para a resposta da API (camelCase)
interface ApiItem {
  id: string
  name: string
  description?: string
  basePrice: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface ItemListResponse {
  data: ApiItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface ItemListParams {
  page?: number
  pageSize?: number
  query?: string
  activeOnly?: boolean
}

export interface CreateItemRequest {
  name: string
  description?: string
  base_price: number
  active?: boolean
}

interface UpdateItemRequest {
  name?: string
  description?: string
  base_price?: number
  active?: boolean
}

// Mapear resposta da API para frontend (camelCase -> snake_case)
function mapApiItemToItem(apiItem: ApiItem): Item {
  return {
    id: apiItem.id,
    name: apiItem.name,
    description: apiItem.description,
    base_price: apiItem.basePrice,
    active: apiItem.active,
    created_at: apiItem.createdAt,
    updated_at: apiItem.updatedAt
  }
}

// Mapear request do frontend para API (snake_case -> camelCase)
function mapCreateItemToApi(item: CreateItemRequest): any {
  return {
    name: item.name,
    description: item.description,
    basePrice: item.base_price,
    active: item.active
  }
}

function mapUpdateItemToApi(item: UpdateItemRequest): any {
  const payload: any = {}
  if (item.name !== undefined) payload.name = item.name
  if (item.description !== undefined) payload.description = item.description
  if (item.base_price !== undefined) payload.basePrice = item.base_price
  if (item.active !== undefined) payload.active = item.active
  return payload
}

export const itemsService = {
  async list(params: ItemListParams = {}) {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    if (params.query) queryParams.append('query', params.query)
    if (params.activeOnly) queryParams.append('activeOnly', 'true')

    const response = await api.get<ItemListResponse>(`/api/tq/v1/items?${queryParams}`)

    return {
      data: response.data.map(mapApiItemToItem),
      pagination: response.pagination
    }
  },

  async getById(id: string) {
    const response = await api.get<ApiItem>(`/api/tq/v1/items/${id}`)
    return mapApiItemToItem(response)
  },

  async create(item: CreateItemRequest) {
    const response = await api.post<ApiItem>('/api/tq/v1/items', mapCreateItemToApi(item))
    return mapApiItemToItem(response)
  },

  async update(id: string, item: UpdateItemRequest) {
    const response = await api.put<ApiItem>(`/api/tq/v1/items/${id}`, mapUpdateItemToApi(item))
    return mapApiItemToItem(response)
  },

  async delete(id: string) {
    await api.delete(`/api/tq/v1/items/${id}`)
  }
}