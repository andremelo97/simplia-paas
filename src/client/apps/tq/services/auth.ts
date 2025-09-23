import { api } from '@client/config/http'
import { useAuthStore } from '../shared/store'

interface UserApp {
  slug: string
  name: string
  roleInApp: string
  expiresAt: string | null
  licenseStatus: string
}

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
    allowedApps: UserApp[]
    userType: string
  }
  token: string
}

export const authService = {
  async getProfile(): Promise<LoginResponse['user']> {
    try {
      const response = await api.get('/internal/api/v1/auth/me')
      return response.data
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

    return roleHierarchy[user.role || 'operations'] >= roleHierarchy[requiredRole]
  },

  hasPlatformRole(requiredPlatformRole: 'internal_admin'): boolean {
    // TQ users don't have platform roles
    return false
  },

  hasAppAccess(appSlug: string): boolean {
    const { user } = useAuthStore.getState()
    if (!user?.allowedApps) return false

    return user.allowedApps.some(app => app.slug === appSlug)
  },

  // TQ-specific: Check if user has TQ app access
  hasTQAccess(): boolean {
    return this.hasAppAccess('tq')
  },

  // Check if user has specific TQ permissions
  hasTQRole(requiredRole?: string): boolean {
    const { user } = useAuthStore.getState()
    if (!user?.allowedApps) return false

    const tqApp = user.allowedApps.find(app => app.slug === 'tq')
    if (!tqApp) return false

    // If no specific role required, just check access
    if (!requiredRole) return true

    // Check specific role in TQ app
    return tqApp.roleInApp === requiredRole
  }
}