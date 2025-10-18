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
  tenantTimezone?: string  // IANA timezone identifier (e.g., 'America/Sao_Paulo')
  tenantLocale?: string    // Locale code (e.g., 'pt-BR', 'en-AU')
  isLoading: boolean
  error: AppError | null
  isHydrated: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  clearError: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  loadUserProfile: () => Promise<void>
  loadEntitlements: () => Promise<void>
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
    tenantTimezone: undefined,
    tenantLocale: undefined,
    isLoading: true, // Start with loading true until everything is ready
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

        // Extract timezone and locale from JWT
        let tenantTimezone = 'America/Sao_Paulo'
        let tenantLocale = 'pt-BR'
        try {
          const base64Payload = token.split('.')[1]
          const paddedBase64 = base64Payload + '==='.slice((base64Payload.length + 3) % 4)
          const payload = JSON.parse(atob(paddedBase64))
          tenantTimezone = payload.timezone || 'America/Sao_Paulo'
          tenantLocale = payload.locale || 'pt-BR'
          console.log('🌍 [Hub Auth] Extracted timezone/locale from JWT:', { tenantTimezone, tenantLocale })
        } catch (error) {
          console.warn('⚠️ [Hub Auth] Failed to extract timezone/locale from JWT, using defaults:', error)
        }

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
          tenantTimezone,
          tenantLocale,
          isLoading: false,
          error: null
        })

        // Load user profile to get allowed apps
        get().loadUserProfile()
      } catch (error: any) {
        // HTTP client now returns AppError instances
        const appError = isAppError(error) ? error : {
          kind: 'unknown' as const,
          message: error?.message || 'Login failed'
        }

        set({
          isAuthenticated: false,
          user: null,
          token: null,
          tenantId: null,
          isLoading: false,
          error: appError
        })
      }
    },

    loadUserProfile: async () => {
      const { token, tenantId } = get()

      if (!token || !tenantId) {
        console.warn('🔄 [Hub Auth] Cannot load profile: missing token or tenant context')
        return
      }

      try {
        set({ isLoading: true })
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
          isLoading: false,
        }))

        // Load entitlements if user is admin
        const currentState = get()
        if (currentState.user?.role === 'admin') {
          currentState.loadEntitlements()
        }
      } catch (error: any) {
        console.error('❌ [Hub Auth] Failed to load profile:', error)

        // Check if this is an authentication error (401/403)
        const isAuthError = error?.status === 401 || error?.status === 403 ||
                           error?.response?.status === 401 || error?.response?.status === 403 ||
                           error?.httpStatus === 401 || error?.httpStatus === 403

        if (isAuthError) {
          console.log('🔓 [Hub Auth] Authentication expired, clearing session')
          // Clear the stuck session
          const { logout } = get()
          logout()
        } else {
          set({
            isLoading: false,
            error: {
              kind: 'unknown',
              message: 'Failed to load profile data',
              code: 'PROFILE_LOAD_ERROR'
            }
          })
        }
      }
    },

    loadEntitlements: async () => {
      const { token, tenantId, user } = get()

      if (!token || !tenantId || user?.role !== 'admin') {
        return
      }

      // This is now handled by TenantEntitlementsSection component
      // No global state tracking needed for entitlements loading
    },

    logout: () => {
      console.log('🔄 [Hub Auth] Logging out...')
      clearSession()

      // Clear shared storage system
      try {
        localStorage.removeItem('auth-storage')
      } catch (e) {
        console.warn('Failed to clear storage:', e)
      }

      set({
        isAuthenticated: false,
        user: null,
        token: null,
        tenantId: null,
        tenantName: undefined,
        tenantSlug: undefined,
        tenantTimezone: undefined,
        tenantLocale: undefined,
        error: null,
        isLoading: false,
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
      // This should be called once on app start after persist hydration
      const state = get()
      set({
        isLoading: false,
        isHydrated: true,
        // If we have token and user but not authenticated, fix the state
        isAuthenticated: !!(state.token && state.user)
      })
    }
  }),
  {
    name: 'auth-storage', // Same storage key as TQ for unified session
    partialize: (state) => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.token,
      tenantId: state.tenantId,
      tenantName: state.tenantName,
      tenantSlug: state.tenantSlug,
      tenantTimezone: state.tenantTimezone,
      tenantLocale: state.tenantLocale
    }),
    onRehydrateStorage: () => (state) => {
      // Initialize after rehydration
      if (state) {
        state.initialize()
      }
    }
  }
))

// Cross-tab logout synchronization: Listen for logout events from TQ or other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth-storage' && e.newValue === null) {
      // Another tab logged out - clear Hub store and redirect to login
      const currentState = useAuthStore.getState()
      if (currentState.isAuthenticated) {
        currentState.logout()
        window.location.href = '/login'
      }
    }
  })
}