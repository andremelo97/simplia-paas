import { api } from '@client/config/http'

export interface MarketplaceItem {
  id: number
  createdAt: string
  updatedAt: string
  type: 'template' | 'landing_page'
  title: string
  description: string | null
  content: string
  specialty: string
  locale: string
  thumbnailUrl: string | null
  importCount: number
  active: boolean
}

interface MarketplaceListParams {
  type?: string
  specialty?: string
  locale?: string
  search?: string
  limit?: number
  offset?: number
}

interface MarketplaceListResponse {
  data: MarketplaceItem[]
  meta: {
    total: number
    limit: number
    offset: number
  }
}

interface MarketplaceDetailResponse {
  data: MarketplaceItem
}

interface MarketplaceImportResponse {
  data: {
    importedId: number
    type: string
  }
  meta: {
    code: string
    message: string
  }
}

class MarketplaceService {
  async getItems(params: MarketplaceListParams = {}): Promise<MarketplaceListResponse> {
    const searchParams = new URLSearchParams()

    if (params.type) searchParams.set('type', params.type)
    if (params.specialty) searchParams.set('specialty', params.specialty)
    if (params.locale) searchParams.set('locale', params.locale)
    if (params.search) searchParams.set('search', params.search)
    if (params.limit) searchParams.set('limit', String(params.limit))
    if (params.offset) searchParams.set('offset', String(params.offset))

    const query = searchParams.toString()
    const url = `/internal/api/v1/marketplace${query ? `?${query}` : ''}`

    return api.get(url)
  }

  async getItem(id: number): Promise<MarketplaceDetailResponse> {
    return api.get(`/internal/api/v1/marketplace/${id}`)
  }

  async importItem(id: number): Promise<MarketplaceImportResponse> {
    return api.post(`/internal/api/v1/marketplace/${id}/import`)
  }
}

export const marketplaceService = new MarketplaceService()
