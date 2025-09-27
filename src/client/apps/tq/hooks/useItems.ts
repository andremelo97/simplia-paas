import { useState, useEffect, useCallback } from 'react'
import { itemsService, Item } from '../services/items'

interface UseItemsListState {
  data: Item[]
  total: number
  loading: boolean
  error: string | null
}

interface UseItemsListParams {
  page: number
  pageSize: number
  query: string
  activeOnly: boolean
}

interface UseItemsListReturn extends UseItemsListState {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setQuery: (query: string) => void
  setActiveOnly: (activeOnly: boolean) => void
  refresh: () => void
}

export const useItemsList = (initialParams?: Partial<UseItemsListParams>): UseItemsListReturn => {
  const [state, setState] = useState<UseItemsListState>({
    data: [],
    total: 0,
    loading: true,
    error: null
  })

  const [params, setParams] = useState<UseItemsListParams>({
    page: 1,
    pageSize: 10,
    query: '',
    activeOnly: false,
    ...initialParams
  })

  const fetchItems = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await itemsService.list({
        page: params.page,
        pageSize: params.pageSize,
        query: params.query,
        activeOnly: params.activeOnly
      })

      setState({
        data: result.data,
        total: result.pagination.total,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching items:', error)
      setState({
        data: [],
        total: 0,
        loading: false,
        error: 'Failed to load items. Please try again.'
      })
    }
  }, [params])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, pageSize, page: 1 }))
  }, [])

  const setQuery = useCallback((query: string) => {
    setParams(prev => ({ ...prev, query, page: 1 }))
  }, [])

  const setActiveOnly = useCallback((activeOnly: boolean) => {
    setParams(prev => ({ ...prev, activeOnly, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    fetchItems()
  }, [fetchItems])

  return {
    ...state,
    currentPage: params.page,
    totalPages: Math.ceil(state.total / params.pageSize),
    setPage,
    setPageSize,
    setQuery,
    setActiveOnly,
    refresh
  }
}