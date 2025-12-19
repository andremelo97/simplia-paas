import { useState, useEffect, useCallback } from 'react'
import { sessionsService, Session, SessionsListParams, SessionsListResponse } from '../services/sessions'
import { getSessionStatusLabel, SessionStatus } from '../types/sessionStatus'

interface UseSessionsListState {
  data: Session[]
  total: number
  loading: boolean
  error: string | null
}

interface UseSessionsListParams {
  page: number
  pageSize: number
  query: string
  statusFilter: SessionStatus | 'all'
}

interface UseSessionsListReturn extends UseSessionsListState {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  setStatusFilter: (status: SessionStatus | 'all') => void
  refresh: () => void
}

export const useSessionsList = (initialParams?: Partial<UseSessionsListParams>): UseSessionsListReturn => {
  const [state, setState] = useState<UseSessionsListState>({
    data: [],
    total: 0,
    loading: true,
    error: null
  })

  const [params, setParams] = useState<UseSessionsListParams>({
    page: 1,
    pageSize: 10,
    query: '',
    statusFilter: 'all',
    ...initialParams
  })

  const fetchSessions = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const apiParams: SessionsListParams = {
        q: params.query || undefined
      }

      const response: SessionsListResponse = await sessionsService.list(apiParams)

      // Filtrar por busca (session number OU patient name) e status
      let filteredData = response.data

      // Filtrar por query (session number OU patient name)
      if (params.query) {
        const query = params.query.toLowerCase()
        filteredData = filteredData.filter(session => {
          const sessionNumber = session.number?.toLowerCase() || ''
          const patientName = `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim().toLowerCase()

          return sessionNumber.includes(query) || patientName.includes(query)
        })
      }

      // Filtrar por status
      if (params.statusFilter !== 'all') {
        filteredData = filteredData.filter(session => session.status === params.statusFilter)
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
        error: 'Failed to load sessions. Please try again.'
      })
    }
  }, [params])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const setQuery = useCallback((query: string) => {
    setParams(prev => ({ ...prev, query, page: 1 }))
  }, [])

  const setStatusFilter = useCallback((statusFilter: SessionStatus | 'all') => {
    setParams(prev => ({ ...prev, statusFilter, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchSessions()
  }, [fetchSessions])

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

// Helper function to format session status
export const formatSessionStatus = (status: string): string => {
  return getSessionStatusLabel(status)
}

// Helper function to format date
// Note: This uses default timezone/locale. For component usage, prefer useDateFormatter() hook
import { formatShortDate as formatShortDateUtil } from '@client/common/utils/dateTime'
export const formatDate = (dateString: string): string => {
  // Default to America/Sao_Paulo and pt-BR if not in React component context
  return formatShortDateUtil(dateString, 'America/Sao_Paulo', 'pt-BR')
}