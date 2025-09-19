import { api } from '@client/config/http'

// Tenant interfaces matching the backend API contract
export interface CreateTenantRequest {
  name: string
  subdomain: string
  timezone: string
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
  timezone: string
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

// Address and Contact interfaces
export interface TenantAddress {
  id: number
  tenantId: number
  type: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  isPrimary: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface TenantContact {
  id: number
  tenantId: number
  type: string
  fullName: string
  email: string
  phone?: string
  title?: string
  department?: string
  notes?: string
  isPrimary: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface TenantAddressesResponse {
  success: boolean
  data: {
    addresses: TenantAddress[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

export interface TenantContactsResponse {
  success: boolean
  data: {
    contacts: TenantContact[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

// CRUD request/response interfaces
export interface CreateAddressRequest {
  type: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  isPrimary?: boolean
}

export interface UpdateAddressRequest {
  type?: string
  label?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  countryCode?: string
  isPrimary?: boolean
}

export interface CreateContactRequest {
  type: string
  fullName: string
  email: string
  phone?: string
  title?: string
  department?: string
  notes?: string
  isPrimary?: boolean
}

export interface UpdateContactRequest {
  type?: string
  fullName?: string
  email?: string
  phone?: string
  title?: string
  department?: string
  notes?: string
  isPrimary?: boolean
}

export interface AddressCRUDResponse {
  success: boolean
  meta: {
    code: string
    message: string
  }
  data: {
    address: TenantAddress
  }
}

export interface ContactCRUDResponse {
  success: boolean
  meta: {
    code: string
    message: string
  }
  data: {
    contact: TenantContact
  }
}

export interface DeleteResponse {
  success: boolean
  meta: {
    code: string
    message: string
  }
}

// Application Users interfaces
export interface AssignedUser {
  id: number
  name: string
  email: string
  role: string
  status: string
  granted: boolean
  accessId: number | null
  grantedAt: string | null
  roleInApp?: string | null
}

export interface AssignedUsersResponse {
  success: boolean
  data: {
    users: AssignedUser[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
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
    if (!tenantData.timezone?.trim()) {
      throw new Error('Timezone is required')
    }

    // Prepare payload matching backend expectations
    const payload = {
      name: tenantData.name.trim(),
      subdomain: tenantData.subdomain.trim(),
      timezone: tenantData.timezone.trim(),
      status: tenantData.status || 'active'
    }

    console.log('🏢 [TenantsService] Creating tenant:', {
      name: payload.name,
      subdomain: payload.subdomain,
      timezone: payload.timezone,
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
   * Reactivate user access to application (Platform Admin)
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param appSlug - Application slug
   * @returns Promise with reactivate result
   */
  async reactivateUserAccess(
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
    console.log('🏢 [TenantsService] Reactivating user access:', { tenantId, userId, appSlug })

    try {
      const response = await api.put(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/reactivate`
      )
      
      console.log('✅ [TenantsService] User access reactivated:', {
        tenantId,
        userId,
        appSlug
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to reactivate user access:', error)
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
      users: {
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
        count: response.data?.users?.length,
        usage: response.data?.usage
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch app users:', error)
      throw error
    }
  }

  /**
   * List tenant addresses
   * @param tenantId - Tenant ID
   * @param params - Query parameters
   * @returns Promise with addresses list
   */
  async listAddresses(tenantId: number, params?: {
    type?: string
    active?: boolean
    limit?: number
    offset?: number
  }): Promise<TenantAddressesResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.type) searchParams.append('type', params.type)
    if (params?.active !== undefined) searchParams.append('active', params.active.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const queryString = searchParams.toString()
    const endpoint = `${this.baseEndpoint}/${tenantId}/addresses${queryString ? `?${queryString}` : ''}`

    console.log('🏢 [TenantsService] Fetching tenant addresses:', { tenantId, params })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [TenantsService] Tenant addresses fetched:', {
        tenantId,
        count: response.data?.addresses?.length,
        total: response.data?.pagination?.total
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch tenant addresses:', error)
      throw error
    }
  }

  /**
   * List tenant contacts
   * @param tenantId - Tenant ID
   * @param params - Query parameters
   * @returns Promise with contacts list
   */
  async listContacts(tenantId: number, params?: {
    type?: string
    active?: boolean
    limit?: number
    offset?: number
  }): Promise<TenantContactsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.type) searchParams.append('type', params.type)
    if (params?.active !== undefined) searchParams.append('active', params.active.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const queryString = searchParams.toString()
    const endpoint = `${this.baseEndpoint}/${tenantId}/contacts${queryString ? `?${queryString}` : ''}`

    console.log('🏢 [TenantsService] Fetching tenant contacts:', { tenantId, params })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [TenantsService] Tenant contacts fetched:', {
        tenantId,
        count: response.data?.contacts?.length,
        total: response.data?.pagination?.total
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to fetch tenant contacts:', error)
      throw error
    }
  }

  /**
   * Create tenant address
   * @param tenantId - Tenant ID
   * @param addressData - Address data
   * @returns Promise with created address
   */
  async createAddress(tenantId: number, addressData: CreateAddressRequest): Promise<AddressCRUDResponse> {
    console.log('🏠 [TenantsService] Creating address for tenant:', tenantId, addressData)

    try {
      const response = await api.post(`${this.baseEndpoint}/${tenantId}/addresses`, addressData)
      
      console.log('✅ [TenantsService] Address created successfully:', {
        tenantId,
        addressId: response.data?.address?.id
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to create address:', error)
      throw error
    }
  }

  /**
   * Update tenant address
   * @param tenantId - Tenant ID
   * @param addressId - Address ID
   * @param addressData - Updated address data
   * @returns Promise with updated address
   */
  async updateAddress(tenantId: number, addressId: number, addressData: UpdateAddressRequest): Promise<AddressCRUDResponse> {
    console.log('🏠 [TenantsService] Updating address:', { tenantId, addressId, ...addressData })

    try {
      const response = await api.put(`${this.baseEndpoint}/${tenantId}/addresses/${addressId}`, addressData)
      
      console.log('✅ [TenantsService] Address updated successfully:', {
        tenantId,
        addressId: response.data?.address?.id
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to update address:', error)
      throw error
    }
  }

  /**
   * Delete tenant address
   * @param tenantId - Tenant ID
   * @param addressId - Address ID
   * @returns Promise with delete result
   */
  async deleteAddress(tenantId: number, addressId: number): Promise<DeleteResponse> {
    console.log('🏠 [TenantsService] Deleting address:', { tenantId, addressId })

    try {
      const response = await api.delete(`${this.baseEndpoint}/${tenantId}/addresses/${addressId}`)
      
      console.log('✅ [TenantsService] Address deleted successfully:', { tenantId, addressId })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to delete address:', error)
      throw error
    }
  }

  /**
   * Create tenant contact
   * @param tenantId - Tenant ID
   * @param contactData - Contact data
   * @returns Promise with created contact
   */
  async createContact(tenantId: number, contactData: CreateContactRequest): Promise<ContactCRUDResponse> {
    console.log('👥 [TenantsService] Creating contact for tenant:', tenantId, contactData)

    try {
      const response = await api.post(`${this.baseEndpoint}/${tenantId}/contacts`, contactData)
      
      console.log('✅ [TenantsService] Contact created successfully:', {
        tenantId,
        contactId: response.data?.contact?.id
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to create contact:', error)
      throw error
    }
  }

  /**
   * Update tenant contact
   * @param tenantId - Tenant ID
   * @param contactId - Contact ID
   * @param contactData - Updated contact data
   * @returns Promise with updated contact
   */
  async updateContact(tenantId: number, contactId: number, contactData: UpdateContactRequest): Promise<ContactCRUDResponse> {
    console.log('👥 [TenantsService] Updating contact:', { tenantId, contactId, ...contactData })

    try {
      const response = await api.put(`${this.baseEndpoint}/${tenantId}/contacts/${contactId}`, contactData)
      
      console.log('✅ [TenantsService] Contact updated successfully:', {
        tenantId,
        contactId: response.data?.contact?.id
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to update contact:', error)
      throw error
    }
  }

  /**
   * Delete tenant contact
   * @param tenantId - Tenant ID
   * @param contactId - Contact ID
   * @returns Promise with delete result
   */
  async deleteContact(tenantId: number, contactId: number): Promise<DeleteResponse> {
    console.log('👥 [TenantsService] Deleting contact:', { tenantId, contactId })

    try {
      const response = await api.delete(`${this.baseEndpoint}/${tenantId}/contacts/${contactId}`)
      
      console.log('✅ [TenantsService] Contact deleted successfully:', { tenantId, contactId })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to delete contact:', error)
      throw error
    }
  }


  /**
   * Update user role in application
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param appSlug - Application slug
   * @param roleInApp - New role for the user in this application
   * @returns Promise with updated role data
   */
  async updateUserRoleInApp(
    tenantId: number,
    userId: number,
    appSlug: string,
    roleInApp: 'user' | 'operations' | 'manager' | 'admin'
  ): Promise<{
    success: boolean
    meta: {
      code: string
      message: string
    }
    data: {
      roleInApp: string
      userId: number
      applicationSlug: string
      updatedAt: string
    }
  }> {
    console.log('🔄 [TenantsService] Updating user role in app:', { tenantId, userId, appSlug, roleInApp })

    try {
      const response = await api.put(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/role`,
        { roleInApp }
      )

      console.log('✅ [TenantsService] User role updated successfully:', {
        tenantId,
        userId,
        appSlug,
        newRole: roleInApp
      })

      return response
    } catch (error) {
      console.error('❌ [TenantsService] Failed to update user role in app:', error)
      throw error
    }
  }

  /**
   * List assigned users for a specific application within a tenant
   * @param tenantId - Tenant ID
   * @param appSlug - Application slug
   * @param options - Query options
   * @returns Promise with assigned users list
   */
  async listApplicationUsers(
    tenantId: number, 
    appSlug: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<AssignedUsersResponse> {
    const { limit = 50, offset = 0 } = options
    
    try {
      const response = await api.get(`${this.baseEndpoint}/${tenantId}/applications/${appSlug}/users`, {
        params: { limit, offset }
      })

      return response
    } catch (error: any) {
      console.error('Failed to list application users:', error)
      throw error
    }
  }
}

// Export singleton instance
export const tenantsService = new TenantsService()
