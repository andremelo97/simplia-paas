import { api } from '@client/config/http'
import { useAuthStore } from '../store/auth'

interface UserApp {
  slug: string
  name: string
  url: string
  iconUrl?: string
  description?: string
}

interface UserAppsResponse {
  data: UserApp[]
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

  async getMyApps(): Promise<UserAppsResponse> {
    const { user, tenantId } = useAuthStore.getState()
    
    if (!user?.userId && !user?.id) {
      throw new Error('User not authenticated')
    }

    if (!tenantId) {
      throw new Error('Tenant context not available')
    }

    // Use new self-service endpoint
    // x-tenant-id header will be automatically injected by interceptor
    const response = await api.get('/internal/api/v1/me/apps')
    
    return response.data // This contains { apps: [...] }
  }

  async getUserProfile() {
    const response = await api.get('/internal/api/v1/auth/me')
    
    return response.data
  }

  async refreshToken() {
    const response = await api.post('/internal/api/v1/auth/refresh', {})
    
    return response.data
  }

  async logout() {
    const { logout } = useAuthStore.getState()
    
    try {
      // Call backend logout endpoint
      await api.post('/internal/api/v1/auth/logout', {})
    } catch (error) {
      console.warn('Backend logout failed:', error)
    } finally {
      // Clear frontend state regardless of backend response
      logout()
      localStorage.removeItem('hub-last-visited-apps')
    }
  }
}

export const hubService = new HubService()