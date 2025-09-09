import { api } from '@client/config/http'
import { UserDto, CreateUserDto, UpdateUserDto, UserFilters, UserListResponse } from '../features/users/types'

// User service API interfaces
export interface CreateUserRequest extends CreateUserDto {
  // All fields from CreateUserDto are used directly
}

export interface UpdateUserRequest extends UpdateUserDto {
  // All fields from UpdateUserDto are used directly
}

export interface UserResponse extends UserDto {
  // All fields from UserDto are used directly
}


export interface CreateUserResponse {
  success: boolean
  meta: {
    code: string
    message: string
  }
  data: {
    user: UserResponse
  }
}

export interface UsersListResponse extends UserListResponse {
  // All fields from UserListResponse are used directly
}

export interface UsersListParams extends UserFilters {
  page?: number // For page-based pagination conversion
}

/**
 * Users API Service
 * Handles communication with the internal users API
 * Uses numeric tenant_id_fk consistently (Users ↔ Tenants 1:1 model)
 */
export class UsersService {
  private readonly globalEndpoint = '/internal/api/v1/users'
  private readonly tenantEndpoint = '/internal/api/v1/tenants'

  /**
   * List users with optional tenant filtering, pagination, and search
   * @param params - List parameters including optional tenantId filter
   * @returns Promise with users list and pagination
   */
  async list(params: UsersListParams = {}): Promise<UsersListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.tenantId) searchParams.append('tenantId', params.tenantId.toString())
    if (params.search) searchParams.append('search', params.search)
    if (params.status && params.status !== 'all') searchParams.append('status', params.status)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    
    // Handle page-based pagination (convert to offset)
    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit
      searchParams.append('offset', offset.toString())
    } else if (params.offset) {
      searchParams.append('offset', params.offset.toString())
    }

    const queryString = searchParams.toString()
    const endpoint = queryString ? `${this.globalEndpoint}?${queryString}` : this.globalEndpoint

    console.log('👥 [UsersService] Fetching users list:', { params, endpoint })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [UsersService] Users list fetched:', {
        count: response.data?.users?.length,
        total: response.data?.pagination?.total,
        tenantFiltered: !!params.tenantId
      })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to fetch users:', error)
      throw error
    }
  }

  /**
   * List users for a specific tenant (tenant-scoped endpoint)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param params - List parameters
   * @returns Promise with users list and pagination
   */
  async listByTenant(tenantId: number, params: Omit<UsersListParams, 'tenantId'> = {}): Promise<UsersListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.search) searchParams.append('search', params.search)
    if (params.status && params.status !== 'all') searchParams.append('status', params.status)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    
    // Handle page-based pagination (convert to offset)
    if (params.page && params.limit) {
      const offset = (params.page - 1) * params.limit
      searchParams.append('offset', offset.toString())
    } else if (params.offset) {
      searchParams.append('offset', params.offset.toString())
    }

    const queryString = searchParams.toString()
    const endpoint = queryString 
      ? `${this.tenantEndpoint}/${tenantId}/users?${queryString}` 
      : `${this.tenantEndpoint}/${tenantId}/users`

    console.log('👥 [UsersService] Fetching tenant users:', { tenantId, params, endpoint })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [UsersService] Tenant users fetched:', {
        count: response.data?.users?.length,
        total: response.data?.pagination?.total,
        tenantId
      })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to fetch tenant users:', error)
      throw error
    }
  }

  /**
   * Get user by ID (uses numeric tenant_id_fk for lookup)
   * @param userId - User ID
   * @param tenantId - Optional numeric tenant ID for tenant-scoped lookup
   * @returns Promise with user data
   */
  async getUser(userId: number, tenantId?: number): Promise<{ success: boolean; data: UserResponse }> {
    let endpoint: string
    
    if (tenantId) {
      endpoint = `${this.tenantEndpoint}/${tenantId}/users/${userId}`
    } else {
      endpoint = `${this.globalEndpoint}/${userId}`
    }

    console.log('👥 [UsersService] Fetching user by ID:', { userId, tenantId, endpoint })
    console.log('🔗 [UsersService] Full URL will be:', `${window.location.origin}${endpoint}`)
    console.log('🔍 [UsersService] URL components:', {
      tenantEndpoint: this.tenantEndpoint,
      tenantId: tenantId,
      userId: userId,
      constructedEndpoint: tenantId ? `${this.tenantEndpoint}/${tenantId}/users/${userId}` : `${this.globalEndpoint}/${userId}`
    })

    try {
      const response = await api.get(endpoint)
      
      console.log('✅ [UsersService] User fetched:', {
        userId: response.data?.id,
        email: response.data?.email,
        tenantId: response.data?.tenantId
      })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to fetch user:', error)
      throw error
    }
  }

  /**
   * Create a new user for a specific tenant (tenant-scoped)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param userData - User creation data
   * @returns Promise with created user data
   */
  async create(tenantId: number, userData: CreateUserRequest): Promise<CreateUserResponse> {
    // Validate required fields
    if (!userData.email?.trim()) {
      throw new Error('Email is required')
    }
    if (!userData.firstName?.trim()) {
      throw new Error('First name is required')
    }
    if (!userData.password?.trim()) {
      throw new Error('Password is required')
    }

    // Prepare payload matching backend expectations (uses numeric tenant_id_fk)
    const payload = {
      email: userData.email.trim().toLowerCase(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName?.trim() || '',
      role: userData.role || 'operations',
      status: userData.status || 'active',
      password: userData.password.trim()
    }

    const endpoint = `${this.tenantEndpoint}/${tenantId}/users`

    console.log('👥 [UsersService] Creating user:', { 
      tenantId,
      email: payload.email, 
      firstName: payload.firstName,
      role: payload.role,
      status: payload.status
    })

    try {
      const response = await api.post(endpoint, payload)
      
      console.log('✅ [UsersService] User created successfully:', {
        userId: response.data?.user?.id,
        email: response.data?.user?.email,
        tenantId
      })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to create user:', error)
      throw error // Let the error handling be done by the caller with AppError
    }
  }

  /**
   * Update user by ID (tenant-scoped)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param userId - User ID
   * @param userData - Update data
   * @returns Promise with updated user data
   */
  async update(tenantId: number, userId: number, userData: UpdateUserRequest): Promise<{ success: boolean; data: UserResponse; meta: { code: string; message: string } }> {
    const endpoint = `${this.tenantEndpoint}/${tenantId}/users/${userId}`

    console.log('👥 [UsersService] Updating user:', { tenantId, userId, ...userData })

    try {
      const response = await api.put(endpoint, userData)
      
      console.log('✅ [UsersService] User updated:', {
        userId: response.data?.id,
        email: response.data?.email,
        tenantId
      })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to update user:', error)
      throw error
    }
  }

  /**
   * Deactivate user (soft delete - sets active=false)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param userId - User ID
   * @returns Promise with success confirmation
   */
  async deactivate(tenantId: number, userId: number): Promise<{ success: boolean; meta: { code: string; message: string } }> {
    const endpoint = `${this.tenantEndpoint}/${tenantId}/users/${userId}`

    console.log('👥 [UsersService] Deactivating user:', { tenantId, userId })

    try {
      const response = await api.delete(endpoint)
      
      console.log('✅ [UsersService] User deactivated:', { userId, tenantId })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to deactivate user:', error)
      throw error
    }
  }

  /**
   * Activate user (sets status=active)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param userId - User ID
   * @returns Promise with updated user data
   */
  async activate(tenantId: number, userId: number): Promise<{ success: boolean; data: UserResponse; meta: { code: string; message: string } }> {
    return this.update(tenantId, userId, { status: 'active' })
  }

  /**
   * Reset user password (admin only)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param userId - User ID
   * @param newPassword - New password
   * @returns Promise with success confirmation
   */
  async resetPassword(tenantId: number, userId: number, newPassword: string): Promise<{ success: boolean; meta: { code: string; message: string } }> {
    const endpoint = `${this.tenantEndpoint}/${tenantId}/users/${userId}/reset-password`

    console.log('👥 [UsersService] Resetting user password:', { tenantId, userId })

    try {
      const response = await api.post(endpoint, { password: newPassword })
      
      console.log('✅ [UsersService] User password reset:', { userId, tenantId })

      return response
    } catch (error) {
      console.error('❌ [UsersService] Failed to reset user password:', error)
      throw error
    }
  }

}

// Export singleton instance
export const usersService = new UsersService()