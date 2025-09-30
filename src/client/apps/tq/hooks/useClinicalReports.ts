import { useState, useEffect, useCallback } from 'react'
import { clinicalReportsService, ClinicalReport, ClinicalReportsListParams, ClinicalReportsListResponse } from '../services/clinicalReports'

interface UseClinicalReportsListState {
  data: ClinicalReport[]
  total: number
  loading: boolean
  error: string | null
}

interface UseClinicalReportsListParams {
  page: number
  pageSize: number
  query: string
}

interface UseClinicalReportsListReturn extends UseClinicalReportsListState {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  refresh: () => void
}

export const useClinicalReportsList = (initialParams?: Partial<UseClinicalReportsListParams>): UseClinicalReportsListReturn => {
  const [state, setState] = useState<UseClinicalReportsListState>({
    data: [],
    total: 0,
    loading: true,
    error: null
  })

  const [params, setParams] = useState<UseClinicalReportsListParams>({
    page: 1,
    pageSize: 10,
    query: '',
    ...initialParams
  })

  const fetchReports = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response: ClinicalReportsListResponse = await clinicalReportsService.list()

      // Defensive: ensure we have data array
      const reportsData = response?.data || []

      // Filtrar por busca (report number OU patient name)
      let filteredData = reportsData

      if (params.query) {
        const query = params.query.toLowerCase()
        filteredData = filteredData.filter(report => {
          const reportNumber = report.number?.toLowerCase() || ''
          const patientName = `${report.patient_first_name || ''} ${report.patient_last_name || ''}`.trim().toLowerCase()

          return reportNumber.includes(query) || patientName.includes(query)
        })
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
      console.error('Error fetching clinical reports:', error)
      setState({
        data: [],
        total: 0,
        loading: false,
        error: 'Failed to load clinical reports. Please try again.'
      })
    }
  }, [params])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

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
    fetchReports()
  }, [fetchReports])

  const totalPages = Math.ceil(state.total / params.pageSize)

  return {
    ...state,
    currentPage: params.page,
    totalPages,
    setPage,
    setPageSize,
    setQuery,
    refresh
  }
}
