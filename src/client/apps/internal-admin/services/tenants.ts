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

export interface TenantMetrics {
  totalUsers: number
  activeUsers: number
  applications: {
    slug: string
    status: string
    userLimit: number | null
    seatsUsed: number
    expiresAt: string | null
  }[]
}

export interface TenantDetailsResponse {
  success: boolean
  data: TenantResponse
  metrics: TenantMetrics
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
      status: tenantData.status || 'active'
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
  async getTenant(id: number): Promise<TenantDetailsResponse> {
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

  /**
   * Activate application license for tenant (Platform Admin)
   * @param tenantId - Tenant ID
   * @param appSlug - Application slug
   * @param licenseData - License configuration
   * @returns Promise with activated license data
   */
  async activateLicense(
    tenantId: number, 
    appSlug: string, 
    licenseData?: {
      userLimit?: number
      expiryDate?: string
      status?: 'active' | 'trial'
    }
  ): Promise<{ 
    success: boolean; 
    data: { 
      license: {
        id: number
        tenantId: number
        applicationSlug: string
        applicationName: string
        status: string
        userLimit: number | null
        seatsUsed: number
        expiryDate: string | null
        activatedAt: string
      }
    } 
  }> {
    console.log('🏢 [TenantsService] Activating license:', { tenantId, appSlug, licenseData })

    try {
      const response = await api.post(
        `${this.baseEndpoint}/${tenantId}/applications/${appSlug}/activate`, 
        licenseData || {}
      )
      
      console.log('✅ [TenantsService] License activated:', {
        tenantId,
        appSlug,
        licenseId: response.data?.license?.id
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to activate license:', error)
      throw error
    }
  }

  /**
   * Adjust application license seats for tenant (Platform Admin)
   * @param tenantId - Tenant ID
   * @param appSlug - Application slug
   * @param adjustmentData - Seat adjustment data
   * @returns Promise with adjusted license data
   */
  async adjustLicense(
    tenantId: number, 
    appSlug: string, 
    adjustmentData: { userLimit: number }
  ): Promise<{ 
    success: boolean; 
    data: { 
      license: {
        id: number
        tenantId: number
        applicationSlug: string
        applicationName: string
        status: string
        userLimit: number
        seatsUsed: number
        seatsAvailable: number
        expiryDate: string | null
        updatedAt: string
      }
    } 
  }> {
    console.log('🏢 [TenantsService] Adjusting license seats:', { tenantId, appSlug, adjustmentData })

    try {
      const response = await api.put(
        `${this.baseEndpoint}/${tenantId}/applications/${appSlug}/adjust`, 
        adjustmentData
      )
      
      console.log('✅ [TenantsService] License seats adjusted:', {
        tenantId,
        appSlug,
        userLimit: response.data?.license?.userLimit,
        seatsUsed: response.data?.license?.seatsUsed
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to adjust license seats:', error)
      throw error
    }
  }

  /**
   * Grant user access to application (Platform Admin)
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param appSlug - Application slug
   * @returns Promise with grant result
   */
  async grantUserAccess(
    tenantId: number, 
    userId: number, 
    appSlug: string
  ): Promise<{ 
    success: boolean; 
    data: { 
      access: {
        id: number
        userId: number
        applicationSlug: string
        tenantId: number
        grantedAt: string
        isActive: boolean
      }
    } 
  }> {
    console.log('🏢 [TenantsService] Granting user access:', { tenantId, userId, appSlug })

    try {
      const response = await api.post(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/grant`
      )
      
      console.log('✅ [TenantsService] User access granted:', {
        tenantId,
        userId,
        appSlug,
        accessId: response.data?.access?.id
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to grant user access:', error)
      throw error
    }
  }

  /**
   * Revoke user access to application (Platform Admin)
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param appSlug - Application slug
   * @returns Promise with revoke result
   */
  async revokeUserAccess(
    tenantId: number, 
    userId: number, 
    appSlug: string
  ): Promise<{ 
    success: boolean; 
    data: { 
      access: {
        id: number
        userId: number
        applicationSlug: string
        tenantId: number
        revokedAt: string
        isActive: boolean
      }
    } 
  }> {
    console.log('🏢 [TenantsService] Revoking user access:', { tenantId, userId, appSlug })

    try {
      const response = await api.post(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/revoke`
      )
      
      console.log('✅ [TenantsService] User access revoked:', {
        tenantId,
        userId,
        appSlug
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to revoke user access:', error)
      throw error
    }
  }

  /**
   * List tenant users with application access status
   * @param tenantId - Tenant ID
   * @param appSlug - Application slug
   * @param params - Query parameters
   * @returns Promise with users list and usage info
   */
  async listAppUsers(
    tenantId: number,
    appSlug: string,
    params?: {
      q?: string
      page?: number
      limit?: number
    }
  ): Promise<{
    success: boolean
    data: {
      usage: {
        used: number
        total: number | null
        available: number | null
      }
      items: {
        id: number
        name: string
        email: string
        role: string
        status: string
        granted: boolean
        accessId: number | null
        grantedAt: string | null
      }[]
      pagination: {
        total: number
        limit: number
        offset: number
        hasMore: boolean
      }
    }
  }> {
    const searchParams = new URLSearchParams()
    
    if (params?.q) searchParams.append('q', params.q)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = `${this.baseEndpoint}/${tenantId}/applications/${appSlug}/users${queryString ? `?${queryString}` : ''}`

    console.log('🏢 [TenantsService] Fetching app users:', { tenantId, appSlug, params })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [TenantsService] App users fetched:', {
        tenantId,
        appSlug,
        count: response.data?.items?.length,
        usage: response.data?.usage
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch app users:', error)
      throw error
    }
  }
}

// Export singleton instance
export const tenantsService = new TenantsService()
