import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@client/config/http'
import { AppError, isAppError } from '@client/common/feedback'
import { tenantLookupByEmail, saveSession, readSession, clearSession, AuthSession } from '@client/common/auth'

interface UserApp {
  slug: string
  name: string
  roleInApp: string
  expiresAt: string | null
  licenseStatus: string
}

interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role?: 'operations' | 'manager' | 'admin'
  tenantId?: number
  tenantSchema?: string
  allowedApps?: UserApp[]
  userType?: {
    id: number
    slug: string
    hierarchyLevel: number
  }
  active?: boolean
  createdAt?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  tenantId: number | null
  tenantName?: string
  tenantSlug?: string
  isLoading: boolean
  error: AppError | null
  isHydrated: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  clearError: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  loadUserProfile: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    isAuthenticated: false,
    user: null,
    token: null,
    tenantId: null,
    tenantName: undefined,
    tenantSlug: undefined,
    isLoading: true, // Start with loading true until hydrated
    error: null,
    isHydrated: false,
    
    login: async (credentials) => {
      set({ isLoading: true, error: null })
      
      try {
        console.log('🔄 [Hub Auth] Starting two-step login...', credentials.email)
        
        // Step 1: Lookup tenant by email
        console.log('🔍 [Hub Auth] Looking up tenant for user...')
        const tenant = await tenantLookupByEmail(credentials.email)
        console.log('🏢 [Hub Auth] Found tenant:', { id: tenant.id, name: tenant.name })
        
        // Step 2: Login with x-tenant-id header
        console.log('🔑 [Hub Auth] Authenticating with tenant context...')
        const response = await api.post('/internal/api/v1/auth/login', credentials, {
          'x-tenant-id': String(tenant.id)
        })
        
        const { user, token } = response.data
        
        // Step 3: Save session with tenant info
        const session: AuthSession = {
          token,
          tenantId: tenant.id,
          user: {
            ...user,
            tenantId: tenant.id
          }
        }
        saveSession(session)
        
        console.log('✅ [Hub Auth] Login successful', { 
          user: user?.email, 
          tenant: tenant.name,
          tenantId: tenant.id
        })
        
        set({
          isAuthenticated: true,
          user: session.user,
          token: session.token,
          tenantId: session.tenantId,
          isLoading: false,
          error: null
        })
      } catch (error: any) {
        console.error('❌ [Hub Auth] Login failed:', error)
        
        let appError: AppError
        if (isAppError(error)) {
          appError = error
        } else {
          appError = {
            kind: 'unknown',
            message: error?.message || 'Login failed. Please try again.',
            code: 'LOGIN_ERROR'
          }
        }
        
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          tenantId: null,
          isLoading: false,
          error: appError
        })
        
        throw appError
      }
    },

    loadUserProfile: async () => {
      const { token, tenantId } = get()

      if (!token || !tenantId) {
        console.warn('🔄 [Hub Auth] Cannot load profile: missing token or tenant context')
        return
      }

      try {
        console.log('🔄 [Hub Auth] Loading user profile...')
        const response = await api.get('/internal/api/v1/auth/me')
        const { data } = response

        console.log('✅ [Hub Auth] Profile loaded:', {
          email: data.email,
          apps: data.allowedApps?.length || 0,
          tenant: data.tenant?.name
        })

        set((state) => ({
          user: {
            ...state.user,
            email: data.email,
            role: data.role,
            allowedApps: data.allowedApps,
          },
          tenantName: data.tenant?.name,
          tenantSlug: data.tenant?.slug,
        }))
      } catch (error) {
        console.error('❌ [Hub Auth] Failed to load profile:', error)
        // Don't logout on profile load failure, just log the error
      }
    },

    logout: () => {
      console.log('🔄 [Hub Auth] Logging out...')
      clearSession()
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        tenantId: null,
        tenantName: undefined,
        tenantSlug: undefined,
        error: null,
        isLoading: false
      })
    },
    
    clearError: () => {
      set({ error: null })
    },
    
    setUser: (user) => {
      set({ user })
    },
    
    setToken: (token) => {
      set({ token, isAuthenticated: !!token })
    },
    
    initialize: () => {
      // Try to restore session from storage
      const session = readSession()

      if (session) {
        console.log('🔄 [Hub Auth] Restoring session', {
          user: session.user?.email,
          tenantId: session.tenantId
        })

        set({
          isAuthenticated: true,
          user: session.user,
          token: session.token,
          tenantId: session.tenantId,
          isHydrated: true,
          isLoading: false
        })

        // Load fresh profile data to get latest apps and tenant info
        const { loadUserProfile } = get()
        loadUserProfile().catch(console.error)
      } else {
        console.log('🔄 [Hub Auth] No session found, starting fresh')

        set({
          isHydrated: true,
          isLoading: false
        })
      }
    }
  }),
  {
    name: 'hub-auth-storage', // Use different name from internal-admin to avoid conflicts
    partialize: (state) => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.token,
      tenantId: state.tenantId,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug
    }),
    onRehydrateStorage: () => (state) => {
      // Initialize after rehydration
      if (state) {
        state.initialize()
      }
    }
  }
))