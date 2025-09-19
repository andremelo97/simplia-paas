import { api } from '@client/config/http'
import { useAuthStore } from '../store'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: number
    email: string
    firstName?: string
    lastName?: string
    role: 'operations' | 'manager' | 'admin'
    tenantId: string
    tenantSchema: string
    platformRole?: 'internal_admin'
    allowedApps: string[]
    userType: string
  }
  token: string
}

export const authService = {
  // TODO: Removed dead code `login()` method - auth store calls platform-auth directly
  // See: docs/internal-login-audit.md for details on actual login flow

  async getProfile(): Promise<LoginResponse['user']> {
    try {
      const response = await api.auth.me()
      return response.data.user
    } catch (error) {
      throw error
    }
  },

  logout() {
    const { logout } = useAuthStore.getState()
    logout()
  },

  isAuthenticated(): boolean {
    const { isAuthenticated, token } = useAuthStore.getState()
    return isAuthenticated && !!token
  },

  getToken(): string | null {
    const { token } = useAuthStore.getState()
    return token
  },

  hasRole(requiredRole: 'operations' | 'manager' | 'admin'): boolean {
    const { user } = useAuthStore.getState()
    if (!user) return false

    const roleHierarchy = {
      operations: 0,
      manager: 1,
      admin: 2
    }

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  },

  hasPlatformRole(requiredPlatformRole: 'internal_admin'): boolean {
    const { user } = useAuthStore.getState()
    return user?.platformRole === requiredPlatformRole
  },

  hasAppAccess(appSlug: string): boolean {
    const { user } = useAuthStore.getState()
    return user?.allowedApps?.includes(appSlug) || false
  }
}