import { useState, useEffect, useCallback } from 'react'
import { sessionsService, Session, SessionsListParams, SessionsListResponse } from '../services/sessions'
import { getSessionStatusLabel, SessionStatus } from '../types/sessionStatus'
import { useDateFilterParams } from '@client/common/utils/dateFilters'

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
  patientId?: string
  createdByUserId?: number
  createdFrom?: string
  createdTo?: string
}

interface UseSessionsListReturn extends UseSessionsListState {
  currentPage: number
  totalPages: number
  patientId?: string
  createdByUserId?: number
  createdFrom?: string
  createdTo?: string
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  setStatusFilter: (status: SessionStatus | 'all') => void
  setPatientId: (patientId?: string) => void
  setCreatedByUserId: (userId?: number) => void
  setCreatedFrom: (date?: string) => void
  setCreatedTo: (date?: string) => void
  refresh: () => void
}

export const useSessionsList = (initialParams?: Partial<UseSessionsListParams>): UseSessionsListReturn => {
  const { convertDateRange } = useDateFilterParams()

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
      // Convert local dates to UTC timestamps
      const dateParams = convertDateRange(params.createdFrom, params.createdTo)

      const apiParams: SessionsListParams = {
        q: params.query || undefined,
        patient_id: params.patientId,
        created_by_user_id: params.createdByUserId,
        status: params.statusFilter !== 'all' ? params.statusFilter : undefined,
        created_from: dateParams.created_from_utc,
        created_to: dateParams.created_to_utc
      }

      const response: SessionsListResponse = await sessionsService.list(apiParams)

      // Client-side search filtering (session number OU patient name)
      let filteredData = response.data

      if (params.query) {
        const query = params.query.toLowerCase()
        filteredData = filteredData.filter(session => {
          const sessionNumber = session.number?.toLowerCase() || ''
          const patientName = `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim().toLowerCase()

          return sessionNumber.includes(query) || patientName.includes(query)
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
        error: 'Failed to load sessions. Please try again.'
      })
    }
  }, [params, convertDateRange])

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
    fetchSessions()
  }, [fetchSessions])

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