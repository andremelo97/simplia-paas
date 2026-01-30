import { useState, useEffect, useCallback } from 'react'
import { clinicalReportsService, ClinicalReport, ClinicalReportsListParams, ClinicalReportsListResponse } from '../services/clinicalReports'
import { useDateFilterParams } from '@client/common/utils/dateFilters'

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
  patientId?: string
  createdByUserId?: number
  createdFrom?: string
  createdTo?: string
}

interface UseClinicalReportsListReturn extends UseClinicalReportsListState {
  currentPage: number
  totalPages: number
  patientId?: string
  createdByUserId?: number
  createdFrom?: string
  createdTo?: string
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  setPatientId: (patientId?: string) => void
  setCreatedByUserId: (userId?: number) => void
  setCreatedFrom: (date?: string) => void
  setCreatedTo: (date?: string) => void
  refresh: () => void
}

export const useClinicalReportsList = (initialParams?: Partial<UseClinicalReportsListParams>): UseClinicalReportsListReturn => {
  const { convertDateRange } = useDateFilterParams()

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
      // Convert local dates to UTC timestamps
      const dateParams = convertDateRange(params.createdFrom, params.createdTo)

      const apiParams: ClinicalReportsListParams = {
        patient_id: params.patientId,
        created_by_user_id: params.createdByUserId,
        created_from: dateParams.created_from_utc,
        created_to: dateParams.created_to_utc
      }

      const response: ClinicalReportsListResponse = await clinicalReportsService.list(apiParams)

      // Defensive: ensure we have data array
      const reportsData = response?.data || []

      // Client-side search filtering (report number OU patient name)
      let filteredData = reportsData

      if (params.query) {
        const query = params.query.toLowerCase()
        filteredData = filteredData.filter(report => {
          const reportNumber = report.number?.toLowerCase() || ''
          const patientName = `${report.patient_first_name || ''} ${report.patient_last_name || ''}`.trim().toLowerCase()

          return reportNumber.includes(query) || patientName.includes(query)
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
        error: 'Failed to load clinical reports. Please try again.'
      })
    }
  }, [params, convertDateRange])

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
    fetchReports()
  }, [fetchReports])

  const totalPages = Math.ceil(state.total / params.pageSize)

  return {
    ...state,
    currentPage: params.page,
    totalPages,
    patientId: params.patientId,
    createdByUserId: params.createdByUserId,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    setPage,
    setPageSize,
    setQuery,
    setPatientId,
    setCreatedByUserId,
    setCreatedFrom,
    setCreatedTo,
    refresh
  }
}
