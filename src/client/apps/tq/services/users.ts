import { api } from '@client/config/http'

export interface TenantUser {
  id: number
  firstName: string
  lastName: string
}

interface ApiResponse {
  data: TenantUser[]
}

export interface UsersListParams {
  search?: string
  limit?: number
}

export const usersService = {
  async list(params: UsersListParams = {}): Promise<TenantUser[]> {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `/api/tq/v1/users${queryString ? `?${queryString}` : ''}`

    const response = await api.get<ApiResponse>(url)
    return response.data
  }
}
