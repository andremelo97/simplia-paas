import { useState, useEffect, useCallback } from 'react'
import { patientsService, Patient, PatientsListParams, PatientsListResponse } from '../services/patients'

interface UsePatientsListState {
  data: Patient[]
  total: number
  loading: boolean
  error: string | null
}

interface UsePatientsListParams {
  page: number
  pageSize: number
  query: string
}

interface UsePatientsListReturn extends UsePatientsListState {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  refresh: () => void
}

export const usePatientsList = (initialParams?: Partial<UsePatientsListParams>): UsePatientsListReturn => {
  const [state, setState] = useState<UsePatientsListState>({
    data: [],
    total: 0,
    loading: true,
    error: null
  })

  const [params, setParams] = useState<UsePatientsListParams>({
    page: 1,
    pageSize: 10,
    query: '',
    ...initialParams
  })

  const fetchPatients = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const apiParams: PatientsListParams = {
        q: params.query || undefined
      }

      const response: PatientsListResponse = await patientsService.list(apiParams)

      // Fazer paginação no frontend
      const startIndex = (params.page - 1) * params.pageSize
      const endIndex = startIndex + params.pageSize
      const paginatedData = response.data.slice(startIndex, endIndex)

      setState({
        data: paginatedData,
        total: response.total || 0,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching patients:', error)
      setState({
        data: [],
        total: 0,
        loading: false,
        error: 'Failed to load patients. Please try again.'
      })
    }
  }, [params])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])


  const setQuery = useCallback((query: string) => {
    setParams(prev => ({ ...prev, query, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchPatients()
  }, [fetchPatients])

  return {
    ...state,
    currentPage: params.page,
    totalPages: Math.ceil(state.total / params.pageSize),
    setPage,
    setPageSize,
    setQuery,
    refresh
  }
}

// Helper function to format patient full name
export const formatPatientName = (patient: Patient): string => {
  return `${patient.first_name}${patient.last_name ? ' ' + patient.last_name : ''}`
}

// Helper function to format date
// Note: This uses default timezone/locale. For component usage, prefer useDateFormatter() hook
import { formatShortDate as formatShortDateUtil } from '@client/common/utils/dateTime'
export const formatDate = (dateString: string): string => {
  // Default to America/Sao_Paulo and pt-BR if not in React component context
  return formatShortDateUtil(dateString, 'America/Sao_Paulo', 'pt-BR')
}