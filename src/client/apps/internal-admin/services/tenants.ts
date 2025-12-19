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

    try {
      // Note: This endpoint does NOT require x-tenant-id header (platform-scoped)
      const response = await api.post(this.baseEndpoint, payload)

      return response
    } catch (error) {
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

    try {
      const response = await api.get(endpoint)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get tenant by Id
   * @param id - Tenant Id
   * @returns Promise with tenant data
   */
  async getTenant(id: number): Promise<TenantDetailsResponse> {
    try {
      const response = await api.get(`${this.baseEndpoint}/${id}`)

      return response
    } catch (error) {
      throw error
    }
  }


  /**
   * Update tenant by Id
   * @param id - Tenant Id
   * @param tenantData - Update data
   * @returns Promise with updated tenant data
   */
  async updateTenant(id: number, tenantData: UpdateTenantRequest): Promise<{ success: boolean; data: TenantResponse }> {
    try {
      const response = await api.put(`${this.baseEndpoint}/${id}`, tenantData)

      return response
    } catch (error) {
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
    try {
      const response = await api.post(
        `${this.baseEndpoint}/${tenantId}/applications/${appSlug}/activate`,
        licenseData || {}
      )

      return response
    } catch (error) {
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
    try {
      const response = await api.put(
        `${this.baseEndpoint}/${tenantId}/applications/${appSlug}/adjust`,
        adjustmentData
      )

      return response
    } catch (error) {
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
    try {
      const response = await api.post(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/grant`
      )

      return response
    } catch (error) {
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
    try {
      const response = await api.post(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/revoke`
      )

      return response
    } catch (error) {
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
    try {
      const response = await api.put(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/reactivate`
      )

      return response
    } catch (error) {
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

    try {
      const response = await api.get(endpoint)

      return response
    } catch (error) {
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

    try {
      const response = await api.get(endpoint)

      return response
    } catch (error) {
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

    try {
      const response = await api.get(endpoint)

      return response
    } catch (error) {
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
    try {
      const response = await api.post(`${this.baseEndpoint}/${tenantId}/addresses`, addressData)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update tenant address
   * @param tenantId - Tenant ID
   * @param addressId - Address Id
   * @param addressData - Updated address data
   * @returns Promise with updated address
   */
  async updateAddress(tenantId: number, addressId: number, addressData: UpdateAddressRequest): Promise<AddressCRUDResponse> {
    try {
      const response = await api.put(`${this.baseEndpoint}/${tenantId}/addresses/${addressId}`, addressData)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete tenant address
   * @param tenantId - Tenant ID
   * @param addressId - Address Id
   * @returns Promise with delete result
   */
  async deleteAddress(tenantId: number, addressId: number): Promise<DeleteResponse> {
    try {
      const response = await api.delete(`${this.baseEndpoint}/${tenantId}/addresses/${addressId}`)

      return response
    } catch (error) {
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
    try {
      const response = await api.post(`${this.baseEndpoint}/${tenantId}/contacts`, contactData)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update tenant contact
   * @param tenantId - Tenant ID
   * @param contactId - Contact Id
   * @param contactData - Updated contact data
   * @returns Promise with updated contact
   */
  async updateContact(tenantId: number, contactId: number, contactData: UpdateContactRequest): Promise<ContactCRUDResponse> {
    try {
      const response = await api.put(`${this.baseEndpoint}/${tenantId}/contacts/${contactId}`, contactData)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete tenant contact
   * @param tenantId - Tenant ID
   * @param contactId - Contact Id
   * @returns Promise with delete result
   */
  async deleteContact(tenantId: number, contactId: number): Promise<DeleteResponse> {
    try {
      const response = await api.delete(`${this.baseEndpoint}/${tenantId}/contacts/${contactId}`)

      return response
    } catch (error) {
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
    try {
      const response = await api.put(
        `${this.baseEndpoint}/${tenantId}/users/${userId}/applications/${appSlug}/role`,
        { roleInApp }
      )

      return response
    } catch (error) {
      throw error
    }
  }

}

// Export singleton instance
export const tenantsService = new TenantsService()
