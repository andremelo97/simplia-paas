import { useState, useEffect, useCallback } from 'react'
import { templatesService, Template, GetTemplatesParams } from '../services/templates'

interface UseTemplatesListState {
  data: Template[]
  total: number
  loading: boolean
  error: string | null
}

interface UseTemplatesListParams {
  page: number
  pageSize: number
  search: string
  active?: boolean
}

interface UseTemplatesListReturn extends UseTemplatesListState {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearch: (search: string) => void
  setActive: (active?: boolean) => void
  refetch: () => void
  refresh: () => void
}

export const useTemplatesList = (initialParams?: Partial<UseTemplatesListParams>): UseTemplatesListReturn => {
  const [state, setState] = useState<UseTemplatesListState>({
    data: [],
    total: 0,
    loading: true,
    error: null
  })

  const [params, setParams] = useState<UseTemplatesListParams>({
    page: 1,
    pageSize: 10,
    search: '',
    active: true,
    ...initialParams
  })

  const fetchTemplates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const apiParams: GetTemplatesParams = {
        limit: params.pageSize,
        offset: (params.page - 1) * params.pageSize,
        active: params.active,
      }

      if (params.search.trim()) {
        apiParams.search = params.search.trim()
      }

      const response = await templatesService.getAll(apiParams)

      setState({
        data: response.templates,
        total: response.total,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching templates:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      }))
    }
  }, [params])

  // Fetch data when params change
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 })) // Reset to page 1 when changing page size
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 })) // Reset to page 1 when searching
  }, [])

  const setActive = useCallback((active?: boolean) => {
    setParams(prev => ({ ...prev, active, page: 1 })) // Reset to page 1 when filtering
  }, [])

  const refetch = useCallback(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const refresh = refetch // Alias for consistency

  const totalPages = Math.ceil(state.total / params.pageSize)

  return {
    ...state,
    currentPage: params.page,
    totalPages,
    setPage,
    setPageSize,
    setSearch,
    setActive,
    refetch,
    refresh
  }
}

interface UseTemplateState {
  data: Template | null
  loading: boolean
  error: string | null
}

interface UseTemplateReturn extends UseTemplateState {
  refetch: () => void
  refresh: () => void
}

export const useTemplate = (id: string): UseTemplateReturn => {
  const [state, setState] = useState<UseTemplateState>({
    data: null,
    loading: true,
    error: null
  })

  const fetchTemplate = useCallback(async () => {
    if (!id) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const template = await templatesService.getById(id)

      setState({
        data: template,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching template:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template'
      }))
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const refetch = useCallback(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const refresh = refetch // Alias for consistency

  return {
    ...state,
    refetch,
    refresh
  }
}

interface UseMostUsedTemplatesState {
  data: Template[]
  loading: boolean
  error: string | null
}

interface UseMostUsedTemplatesReturn extends UseMostUsedTemplatesState {
  refetch: () => void
  refresh: () => void
}

export const useMostUsedTemplates = (limit: number = 10): UseMostUsedTemplatesReturn => {
  const [state, setState] = useState<UseMostUsedTemplatesState>({
    data: [],
    loading: true,
    error: null
  })

  const fetchMostUsed = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const templates = await templatesService.getMostUsed(limit)

      setState({
        data: templates,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching most used templates:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch most used templates'
      }))
    }
  }, [limit])

  useEffect(() => {
    fetchMostUsed()
  }, [fetchMostUsed])

  const refetch = useCallback(() => {
    fetchMostUsed()
  }, [fetchMostUsed])

  const refresh = refetch // Alias for consistency

  return {
    ...state,
    refetch,
    refresh
  }
}