import { api } from '@client/config/http'

// Tenant interfaces matching the backend API contract
export interface CreateTenantRequest {
  name: string
  subdomain: string
  status?: 'active' | 'trial' | 'inactive'
}

export interface UpdateTenantRequest {
  name?: string
  description?: string
  status?: 'active' | 'trial' | 'inactive'
}

export interface TenantResponse {
  id: number
  name: string
  subdomain: string
  schemaName: string
  status: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTenantResponse {
  success: boolean
  message: string
  data: {
    tenant: TenantResponse
  }
}

export interface TenantsListResponse {
  success: boolean
  data: {
    tenants: TenantResponse[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

export interface TenantsListParams {
  status?: string
  limit?: number
  offset?: number
  search?: string
  page?: number
}

/**
 * Tenants API Service
 * Handles communication with the internal tenants API
 */
export class TenantsService {
  private readonly baseEndpoint = '/internal/api/v1/tenants'

  /**
   * Create a new tenant
   * Backend expects: { name: string, subdomain: string, status?: string }
   * @param tenantData - Tenant creation data
   * @returns Promise with created tenant data
   */
  async create(tenantData: CreateTenantRequest): Promise<CreateTenantResponse> {
    // Validate required fields
    if (!tenantData.name?.trim()) {
      throw new Error('Tenant name is required')
    }
    if (!tenantData.subdomain?.trim()) {
      throw new Error('Subdomain is required')
    }

    // Prepare payload matching backend expectations
    const payload = {
      name: tenantData.name.trim(),
      subdomain: tenantData.subdomain.trim(),
      status: tenantData.status || 'trial'
    }

    console.log('🏢 [TenantsService] Creating tenant:', { 
      name: payload.name, 
      subdomain: payload.subdomain,
      status: payload.status 
    })

    try {
      // Note: This endpoint does NOT require x-tenant-id header (platform-scoped)
      const response = await api.post(this.baseEndpoint, payload)
      
      console.log('✅ [TenantsService] Tenant created successfully:', {
        tenantId: response.data?.tenant?.id,
        subdomain: response.data?.tenant?.subdomain
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to create tenant:', error)
      throw error // Let the error handling be done by the caller with AppError
    }
  }

  /**
   * List tenants with pagination and filters
   * @param params - List parameters
   * @returns Promise with tenants list and pagination
   */
  async list(params: TenantsListParams = {}): Promise<TenantsListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.status) searchParams.append('status', params.status)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.search) searchParams.append('search', params.search)
    
    // Handle page-based pagination (convert to offset)
    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit
      searchParams.append('offset', offset.toString())
    } else if (params.offset) {
      searchParams.append('offset', params.offset.toString())
    }

    const queryString = searchParams.toString()
    const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint

    console.log('🏢 [TenantsService] Fetching tenants list:', { params, endpoint })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [TenantsService] Tenants list fetched:', {
        count: response.data?.tenants?.length,
        total: response.data?.pagination?.total
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch tenants:', error)
      throw error
    }
  }

  /**
   * Get tenant by ID
   * @param id - Tenant ID
   * @returns Promise with tenant data
   */
  async getTenant(id: number): Promise<{ success: boolean; data: TenantResponse }> {
    console.log('🏢 [TenantsService] Fetching tenant by ID:', id)

    try {
      const response = await api.get(`${this.baseEndpoint}/${id}`)
      
      console.log('✅ [TenantsService] Tenant fetched:', {
        tenantId: response.data?.id,
        name: response.data?.name
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch tenant:', error)
      throw error
    }
  }

  /**
   * Get tenant by ID (alias for backward compatibility)
   * @param id - Tenant ID
   * @returns Promise with tenant data
   */
  async getById(id: number): Promise<{ success: boolean; data: { tenant: TenantResponse } }> {
    console.log('🏢 [TenantsService] Fetching tenant by ID (deprecated method):', id)

    try {
      const response = await api.get(`${this.baseEndpoint}/${id}`)
      
      console.log('✅ [TenantsService] Tenant fetched:', {
        tenantId: response.data?.tenant?.id,
        name: response.data?.tenant?.name
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch tenant:', error)
      throw error
    }
  }

  /**
   * Update tenant by ID
   * @param id - Tenant ID
   * @param tenantData - Update data
   * @returns Promise with updated tenant data
   */
  async updateTenant(id: number, tenantData: UpdateTenantRequest): Promise<{ success: boolean; data: TenantResponse }> {
    console.log('🏢 [TenantsService] Updating tenant:', { id, ...tenantData })

    try {
      const response = await api.put(`${this.baseEndpoint}/${id}`, tenantData)
      
      console.log('✅ [TenantsService] Tenant updated:', {
        tenantId: response.data?.id,
        name: response.data?.name
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to update tenant:', error)
      throw error
    }
  }
}

// Export singleton instance
export const tenantsService = new TenantsService()
