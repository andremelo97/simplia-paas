import { api } from '@client/config/http'

export interface Quote {
  id: string // UUID
  number: string // QUO000001, QUO000002, etc
  session_id: string
  content?: string
  total: number
  status: string // 'draft', 'sent', 'approved', 'rejected', 'expired'
  created_at: string
  updated_at: string
  // Session data when includeSession=true
  session_number?: string
  session_status?: string
  patient_id?: string
  // Patient data when includeSession=true
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
  patient_phone?: string
  // Quote items when includeItems=true
  items?: QuoteItem[]
}

export interface QuoteItem {
  id: string
  quote_id: string
  name: string
  description?: string
  base_price: number
  discount_amount: number
  final_price: number
  quantity: number
  created_at: string
  updated_at: string
}

// Interface para a resposta da API (camelCase)
interface ApiQuote {
  id: string
  number: string
  sessionId: string
  content?: string
  total: number
  status: string
  createdAt: string
  updatedAt: string
  // Session data when includeSession=true (API returns snake_case for joined data)
  session_number?: string
  session_status?: string
  patient_id?: string
  // Patient data when includeSession=true (API returns snake_case for joined data)
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
  // Quote items when includeItems=true
  items?: QuoteItem[]
}

export interface QuotesListParams {
  offset?: number
  limit?: number
  sessionId?: string
  status?: string
  includeSession?: boolean
}

export interface QuotesListResponse {
  data: Quote[]
  total: number
}

export interface CreateQuoteRequest {
  sessionId: string
  content?: string
  status?: string
}

export interface UpdateQuoteRequest {
  content?: string
  total?: number
  status?: string
}

export interface QuoteItemInput {
  itemId: string
  quantity?: number
  discountAmount?: number
}

export interface ReplaceQuoteItemsRequest {
  items: QuoteItemInput[]
}

export const quotesService = {
  async list(params: QuotesListParams = {}): Promise<QuotesListResponse> {
    const queryParams = new URLSearchParams()
    if (params.sessionId) queryParams.append('sessionId', params.sessionId)
    if (params.status) queryParams.append('status', params.status)
    if (params.includeSession) queryParams.append('includeSession', 'true')

    // Always include session data and items for display
    queryParams.append('includeSession', 'true')
    queryParams.append('includeItems', 'true')


    const url = `/api/tq/v1/quotes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await api.get(url)

    // A API retorna o array diretamente no response
    const apiResponse = response

    let quotesData: ApiQuote[]
    let total: number

    // API retorna todos os registros como array direto
    if (Array.isArray(apiResponse)) {
      quotesData = apiResponse
      total = apiResponse.length
    } else {
      throw new Error('Invalid API response structure')
    }

    // Mapear dados da API para o formato esperado
    const mappedQuotes: Quote[] = quotesData.map(apiQuote => ({
      id: apiQuote.id,
      number: apiQuote.number,
      session_id: apiQuote.sessionId,
      content: apiQuote.content,
      total: apiQuote.total,
      status: apiQuote.status,
      created_at: apiQuote.createdAt,
      updated_at: apiQuote.updatedAt,
      // Session data (API returns snake_case for joined data)
      session_number: apiQuote.session_number,
      session_status: apiQuote.session_status,
      patient_id: apiQuote.patient_id,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiQuote.patient_first_name,
      patient_last_name: apiQuote.patient_last_name,
      patient_email: apiQuote.patient_email,
      patient_phone: apiQuote.patient_phone,
      // Items if included
      items: apiQuote.items
    }))

    return {
      data: mappedQuotes,
      total
    }
  },

  async getQuote(id: string): Promise<Quote> {
    const response = await api.get(`/api/tq/v1/quotes/${id}?includeSession=true&includeItems=true`)

    if (!response.data) {
      throw new Error('No data received from API')
    }

    const apiQuote = response.data

    if (!apiQuote || !apiQuote.id) {
      throw new Error('Quote data is invalid in API response')
    }

    // Map camelCase response to snake_case frontend format
    const mappedQuote: Quote = {
      id: apiQuote.id,
      number: apiQuote.number,
      session_id: apiQuote.sessionId,
      content: apiQuote.content,
      total: apiQuote.total,
      status: apiQuote.status,
      created_at: apiQuote.createdAt,
      updated_at: apiQuote.updatedAt,
      // Session data (API returns snake_case for joined data)
      session_number: apiQuote.session_number,
      session_status: apiQuote.session_status,
      patient_id: apiQuote.patient_id,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiQuote.patient_first_name,
      patient_last_name: apiQuote.patient_last_name,
      patient_email: apiQuote.patient_email,
      patient_phone: apiQuote.patient_phone,
      // Items if included
      items: apiQuote.items
    }

    return mappedQuote
  },

  async createQuote(data: CreateQuoteRequest): Promise<Quote> {
    // Transform snake_case to camelCase for API
    const apiData = {
      sessionId: data.sessionId,
      content: data.content,
      status: data.status
    }

    const response = await api.post('/api/tq/v1/quotes', apiData)

    if (!response) {
      throw new Error('Invalid API response structure for create quote')
    }

    // The API returns quote data directly in response (not response.data)
    const apiQuote = response

    // Map camelCase response to snake_case frontend format
    const mappedQuote: Quote = {
      id: apiQuote.id,
      number: apiQuote.number,
      session_id: apiQuote.sessionId,
      content: apiQuote.content,
      total: apiQuote.total,
      status: apiQuote.status,
      created_at: apiQuote.createdAt,
      updated_at: apiQuote.updatedAt,
      // Session data (API returns snake_case for joined data)
      session_number: apiQuote.session_number,
      session_status: apiQuote.session_status,
      patient_id: apiQuote.patient_id,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiQuote.patient_first_name,
      patient_last_name: apiQuote.patient_last_name,
      patient_email: apiQuote.patient_email
    }

    return mappedQuote
  },

  async updateQuote(id: string, data: UpdateQuoteRequest): Promise<Quote> {
    // Transform snake_case to camelCase for API
    const apiData: any = {}
    if (data.content !== undefined) apiData.content = data.content
    if (data.total !== undefined) apiData.total = data.total
    if (data.status !== undefined) apiData.status = data.status

    const response = await api.put(`/api/tq/v1/quotes/${id}`, apiData)

    if (!response.data) {
      throw new Error('Invalid API response structure for update quote')
    }

    // The API returns quote data directly in response.data
    const apiQuote = response.data

    // Map camelCase response to snake_case frontend format
    const mappedQuote: Quote = {
      id: apiQuote.id,
      number: apiQuote.number,
      session_id: apiQuote.sessionId,
      content: apiQuote.content,
      total: apiQuote.total,
      status: apiQuote.status,
      created_at: apiQuote.createdAt,
      updated_at: apiQuote.updatedAt,
      // Session data (API returns snake_case for joined data)
      session_number: apiQuote.session_number,
      session_status: apiQuote.session_status,
      patient_id: apiQuote.patient_id,
      // Patient data (API returns snake_case for joined data)
      patient_first_name: apiQuote.patient_first_name,
      patient_last_name: apiQuote.patient_last_name,
      patient_email: apiQuote.patient_email
    }

    return mappedQuote
  },

  async deleteQuote(id: string): Promise<void> {
    await api.delete(`/api/tq/v1/quotes/${id}`)
  },

  // Quote Items methods
  async getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
    const response = await api.get(`/api/tq/v1/quotes/${quoteId}/items`)
    return response || []
  },

  async replaceQuoteItems(quoteId: string, data: ReplaceQuoteItemsRequest): Promise<{ quote: Quote; items: QuoteItem[] }> {
    const response = await api.post(`/api/tq/v1/quotes/${quoteId}/items`, data)
    return response.data
  }
}