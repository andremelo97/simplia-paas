import { useState, useEffect, useCallback } from 'react'
import { quotesService, Quote, QuotesListParams, QuotesListResponse } from '../services/quotes'
import { getQuoteStatusLabel, QuoteStatus } from '../types/quoteStatus'

interface UseQuotesListState {
  data: Quote[]
  total: number
  loading: boolean
  error: string | null
}

interface UseQuotesListParams {
  page: number
  pageSize: number
  query: string
  statusFilter: QuoteStatus | 'all'
  sessionId?: string
}

interface UseQuotesListReturn extends UseQuotesListState {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  setStatusFilter: (status: QuoteStatus | 'all') => void
  refresh: () => void
}

export const useQuotesList = (initialParams?: Partial<UseQuotesListParams>): UseQuotesListReturn => {
  const [state, setState] = useState<UseQuotesListState>({
    data: [],
    total: 0,
    loading: true,
    error: null
  })

  const [params, setParams] = useState<UseQuotesListParams>({
    page: 1,
    pageSize: 10,
    query: '',
    statusFilter: 'all',
    ...initialParams
  })

  const fetchQuotes = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const apiParams: QuotesListParams = {
        sessionId: params.sessionId
      }

      const response: QuotesListResponse = await quotesService.list(apiParams)

      // Filtrar por busca (quote number OU patient name) e status
      let filteredData = response.data

      // Filtrar por query (quote number OU patient name)
      if (params.query) {
        const query = params.query.toLowerCase()
        filteredData = filteredData.filter(quote => {
          const quoteNumber = quote.number?.toLowerCase() || ''
          const patientName = `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim().toLowerCase()

          return quoteNumber.includes(query) || patientName.includes(query)
        })
      }

      // Filtrar por status
      if (params.statusFilter !== 'all') {
        filteredData = filteredData.filter(quote => quote.status === params.statusFilter)
      }

      // Fazer paginação no frontend
      const startIndex = (params.page - 1) * params.pageSize
      const endIndex = startIndex + params.pageSize
      const paginatedData = filteredData.slice(startIndex, endIndex)

      setState({
        data: paginatedData,
        total: filteredData.length,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        data: [],
        total: 0,
        loading: false,
        error: 'Failed to load quotes. Please try again.'
      })
    }
  }, [params])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const setQuery = useCallback((query: string) => {
    setParams(prev => ({ ...prev, query, page: 1 }))
  }, [])

  const setStatusFilter = useCallback((statusFilter: QuoteStatus | 'all') => {
    setParams(prev => ({ ...prev, statusFilter, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchQuotes()
  }, [fetchQuotes])

  return {
    ...state,
    currentPage: params.page,
    totalPages: Math.ceil(state.total / params.pageSize),
    setPage,
    setPageSize,
    setQuery,
    setStatusFilter,
    refresh
  }
}

// Helper function to format quote status
export const formatQuoteStatus = (status: string): string => {
  return getQuoteStatusLabel(status)
}

// Helper function to format date
// Note: This uses default timezone/locale. For component usage, prefer useDateFormatter() hook
import { formatShortDate as formatShortDateUtil } from '@client/common/utils/dateTime'
export const formatDate = (dateString: string): string => {
  // Default to America/Sao_Paulo and pt-BR if not in React component context
  return formatShortDateUtil(dateString, 'America/Sao_Paulo', 'pt-BR')
}