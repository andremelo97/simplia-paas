import { useState, useEffect, useCallback } from 'react'
import { quotesService, Quote, QuotesListParams, QuotesListResponse } from '../services/quotes'
import { getQuoteStatusLabel, QuoteStatus } from '../types/quoteStatus'
import { useDateFilterParams } from '@client/common/utils/dateFilters'

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
  patientId?: string
  createdByUserId?: number
  createdFrom?: string
  createdTo?: string
}

interface UseQuotesListReturn extends UseQuotesListState {
  currentPage: number
  totalPages: number
  patientId?: string
  createdByUserId?: number
  createdFrom?: string
  createdTo?: string
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  setStatusFilter: (status: QuoteStatus | 'all') => void
  setPatientId: (patientId?: string) => void
  setCreatedByUserId: (userId?: number) => void
  setCreatedFrom: (date?: string) => void
  setCreatedTo: (date?: string) => void
  refresh: () => void
}

export const useQuotesList = (initialParams?: Partial<UseQuotesListParams>): UseQuotesListReturn => {
  const { convertDateRange } = useDateFilterParams()

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
      // Convert local dates to UTC timestamps
      const dateParams = convertDateRange(params.createdFrom, params.createdTo)

      const apiParams: QuotesListParams = {
        sessionId: params.sessionId,
        patient_id: params.patientId,
        created_by_user_id: params.createdByUserId,
        status: params.statusFilter !== 'all' ? params.statusFilter : undefined,
        created_from: dateParams.created_from_utc,
        created_to: dateParams.created_to_utc
      }

      const response: QuotesListResponse = await quotesService.list(apiParams)

      // Client-side search filtering (quote number OU patient name)
      let filteredData = response.data

      if (params.query) {
        const query = params.query.toLowerCase()
        filteredData = filteredData.filter(quote => {
          const quoteNumber = quote.number?.toLowerCase() || ''
          const patientName = `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim().toLowerCase()

          return quoteNumber.includes(query) || patientName.includes(query)
        })
      }

      // Client-side pagination
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
  }, [params, convertDateRange])

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

  const setPatientId = useCallback((patientId?: string) => {
    setParams(prev => ({ ...prev, patientId, page: 1 }))
  }, [])

  const setCreatedByUserId = useCallback((createdByUserId?: number) => {
    setParams(prev => ({ ...prev, createdByUserId, page: 1 }))
  }, [])

  const setCreatedFrom = useCallback((createdFrom?: string) => {
    setParams(prev => ({ ...prev, createdFrom, page: 1 }))
  }, [])

  const setCreatedTo = useCallback((createdTo?: string) => {
    setParams(prev => ({ ...prev, createdTo, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchQuotes()
  }, [fetchQuotes])

  return {
    ...state,
    currentPage: params.page,
    totalPages: Math.ceil(state.total / params.pageSize),
    patientId: params.patientId,
    createdByUserId: params.createdByUserId,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    setPage,
    setPageSize,
    setQuery,
    setStatusFilter,
    setPatientId,
    setCreatedByUserId,
    setCreatedFrom,
    setCreatedTo,
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