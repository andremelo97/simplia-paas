import { api } from '@client/config/http'
import { useAuthStore } from '../store/auth'

interface UserApp {
  slug: string
  name: string
  roleInApp: string
  expiresAt: string | null
  licenseStatus: string
  url?: string
  iconUrl?: string
  description?: string
}

interface UserProfile {
  email: string
  role: string
  allowedApps: UserApp[]
  tenant: {
    name: string
    slug: string
  }
}

interface UserProfileResponse {
  success: boolean
  data: UserProfile
}

interface EntitlementUser {
  email: string
  firstName?: string
  lastName?: string
  role: 'operations' | 'manager' | 'admin'
  grantedAt: string
}

interface EntitlementLicense {
  applicationId: number
  slug: string
  name: string
  status: 'active' | 'suspended' | 'expired'
  activatedAt: string
  seatsUsed: number
  maxUsers: number | null
  users: EntitlementUser[]
}

interface EntitlementsSummary {
  apps: number
  seatsUsed: number
  seatsLimit: number | null
}

interface EntitlementsResponse {
  data: {
    licenses: EntitlementLicense[]
    summary: EntitlementsSummary
  }
  meta: {
    code: string
  }
}

class HubService {
  async login(credentials: { email: string; password: string }) {
    const { tenantId } = useAuthStore.getState()
    
    if (!tenantId) {
      throw new Error('Tenant context not available for login')
    }
    
    // Use existing tenant authentication endpoint
    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.post('/internal/api/v1/auth/login', credentials)
    
    return response
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    const { user, tenantId } = useAuthStore.getState()

    if (!user?.userId && !user?.id) {
      throw new Error('User not authenticated')
    }

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // Use consolidated /auth/me endpoint that returns both profile and apps
    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.get('/internal/api/v1/auth/me')

    return response.data
  }

  // Legacy method for backward compatibility - now delegates to getUserProfile
  async getMyApps(): Promise<{ apps: UserApp[] }> {
    const profileResponse = await this.getUserProfile()
    return { apps: profileResponse.data.allowedApps }
  }

  async refreshToken() {
    const { token } = useAuthStore.getState()

    if (!token) {
      throw new Error('No token available for refresh')
    }

    const response = await api.post('/internal/api/v1/auth/refresh', { token })

    return response.data
  }

  async logout() {
    const { logout } = useAuthStore.getState()

    try {
      // Call backend logout endpoint
      await api.post('/internal/api/v1/auth/logout', {})
    } catch (error) {
      // Backend logout failed - clear frontend state anyway
    } finally {
      // Clear frontend state regardless of backend response
      logout()
      localStorage.removeItem('hub-last-visited-apps')
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const { tenantId } = useAuthStore.getState()

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.post('/internal/api/v1/auth/change-password', {
      currentPassword,
      newPassword
    })

    return response.data
  }

  async getEntitlements(): Promise<EntitlementsResponse> {
    const { tenantId } = useAuthStore.getState()

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.get('/internal/api/v1/entitlements')

    return response.data
  }

  async forgotPassword(email: string) {
    // Uses platform-auth route (no tenant context required)
    const response = await api.post('/internal/api/v1/platform-auth/forgot-password', { email })
    return response.data
  }
}

export const hubService = new HubService()