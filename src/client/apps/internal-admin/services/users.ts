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
  private readonly globalEndpoint = '/internal/api/v1/tenants/users'
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

    try {
      const response = await api.get(endpoint)

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * List users for a specific tenant (uses global endpoint with tenant filter)
   * @param tenantId - Numeric tenant ID (tenant_id_fk)
   * @param params - List parameters
   * @returns Promise with users list and pagination
   */
  async listByTenant(tenantId: number, params: Omit<UsersListParams, 'tenantId'> = {}): Promise<UsersListResponse> {
    // Use the global endpoint with tenantId filter for consistency
    return this.list({ ...params, tenantId })
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

    try {
      const response = await api.get(endpoint)

      return response
    } catch (error) {
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
    const payload: Record<string, any> = {
      email: userData.email.trim().toLowerCase(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName?.trim() || '',
      role: userData.role || 'operations',
      status: userData.status || 'active',
      password: userData.password.trim()
    }

    // Include platformRole if provided (for internal admin users)
    if (userData.platformRole) {
      payload.platformRole = userData.platformRole
    }

    const endpoint = `${this.tenantEndpoint}/${tenantId}/users`

    try {
      const response = await api.post(endpoint, payload)

      return response
    } catch (error) {
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

    try {
      const response = await api.put(endpoint, userData)

      return response
    } catch (error) {
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

    try {
      const response = await api.delete(endpoint)

      return response
    } catch (error) {
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

    try {
      const response = await api.post(endpoint, { password: newPassword })

      return response
    } catch (error) {
      throw error
    }
  }

}

// Export singleton instance
export const usersService = new UsersService()