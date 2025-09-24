import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@client/config/http'
import { AppError, isAppError } from '@client/common/feedback'
import { tenantLookupByEmail, clearSession } from '@client/common/auth'

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
  loginWithToken: (token: string, tenantId: number) => Promise<void>
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
    isLoading: true, // Start with loading true until everything is ready
    error: null,
    isHydrated: false,

    login: async (credentials) => {
      set({ isLoading: true, error: null })

      try {
        console.log('🔄 [TQ Auth] Starting two-step login...', credentials.email)

        // Step 1: Lookup tenant by email (same as Hub)
        console.log('🔍 [TQ Auth] Looking up tenant for user...')
        const tenant = await tenantLookupByEmail(credentials.email)
        console.log('🏢 [TQ Auth] Found tenant:', { id: tenant.id, name: tenant.name })

        // Step 2: Login with x-tenant-id header (same as Hub)
        console.log('🔑 [TQ Auth] Authenticating with tenant context...')
        const response = await api.post('/internal/api/v1/auth/login', credentials, {
          'x-tenant-id': String(tenant.id)
        })

        const { user, token } = response.data

        console.log('✅ [TQ Auth] Login successful', {
          user: user?.email,
          tenant: tenant.name,
          tenantId: tenant.id
        })

        set({
          isAuthenticated: true,
          user: {
            ...user,
            tenantId: tenant.id
          },
          token: token,
          tenantId: tenant.id,
          isLoading: false,
          error: null
        })

        // Load fresh profile data to get latest apps
        const { loadUserProfile } = get()
        loadUserProfile().catch(console.error)
      } catch (error: any) {
        console.error('❌ [TQ Auth] Login failed:', error)

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
        console.warn('🔄 [TQ Auth] Cannot load profile: missing token or tenant context')
        return
      }

      try {
        set({ isLoading: true })
        console.log('🔄 [TQ Auth] Loading user profile...')

        const response = await api.get('/internal/api/v1/auth/me')
        const { data } = response

        console.log('✅ [TQ Auth] Profile loaded:', {
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
          // Preserve tenant name from JWT if already set, otherwise use API data
          tenantName: state.tenantName || data.tenant?.name,
          tenantSlug: state.tenantSlug || data.tenant?.slug,
          isLoading: false,
        }))
      } catch (error: any) {
        console.error('❌ [TQ Auth] Failed to load profile:', error)

        // Check if this is an authentication error (401/403)
        const isAuthError = error?.status === 401 || error?.status === 403 ||
                           error?.response?.status === 401 || error?.response?.status === 403 ||
                           error?.httpStatus === 401 || error?.httpStatus === 403

        if (isAuthError) {
          console.log('🔓 [TQ Auth] Authentication expired, clearing session')
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

    // SSO login method for token from Hub
    loginWithToken: async (token: string, tenantId: number) => {
      set({ isLoading: true, error: null })
      try {
        console.log('🔄 [TQ Auth] SSO login with token...')

        // Get current state to preserve existing tenant info from Hub
        const currentState = get()
        console.log('🔍 [TQ Auth] Current tenant info before SSO:', {
          tenantName: currentState.tenantName,
          tenantSlug: currentState.tenantSlug
        })

        // Decode JWT to get user info with proper UTF-8 handling
        const base64Payload = token.split('.')[1]

        // Proper UTF-8 safe JWT decoding
        function decodeJWTPayload(base64String) {
          // Add padding if needed
          const paddedBase64 = base64String + '==='.slice((base64String.length + 3) % 4)

          try {
            // Convert base64 to binary string
            const binaryString = atob(paddedBase64)

            // Convert binary string to UTF-8 encoded string
            const utf8String = decodeURIComponent(
              binaryString
                .split('')
                .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )

            return JSON.parse(utf8String)
          } catch (error) {
            console.warn('JWT decode failed, trying fallback method:', error)
            // Fallback to standard method
            return JSON.parse(atob(paddedBase64))
          }
        }

        const payload = decodeJWTPayload(base64Payload)
        console.log('🔍 [TQ Auth] Decoded payload:', payload)

        // Use tenant name from current state (Hub) if available, otherwise from JWT/fallback
        const tenantName = currentState.tenantName && !currentState.tenantName.startsWith('Tenant ')
          ? currentState.tenantName
          : payload.tenantName || payload.tenant?.name || `Tenant ${tenantId}`

        const tenantSlug = currentState.tenantSlug || payload.tenantSlug || payload.tenant?.slug

        console.log('🔍 [TQ Auth] Final tenant info:', {
          fromState: currentState.tenantName,
          fromJWT: payload.tenantName || payload.tenant?.name,
          final: tenantName
        })

        set({
          isAuthenticated: true,
          user: {
            id: payload.userId,
            email: payload.email,
            firstName: payload.firstName || payload.name?.split(' ')[0],
            lastName: payload.lastName || payload.name?.split(' ').slice(1).join(' '),
            role: payload.role,
            tenantId: payload.tenantId,
            allowedApps: payload.allowedApps?.map(slug => ({ slug, name: slug, roleInApp: 'user', licenseStatus: 'active', expiresAt: null }))
          },
          token: token,
          tenantId: tenantId,
          tenantName: tenantName,
          tenantSlug: tenantSlug,
          isLoading: false,
          error: null
        })

        console.log('✅ [TQ Auth] SSO login successful - final tenant name:', tenantName)
      } catch (error: any) {
        console.error('❌ [TQ Auth] SSO login failed:', error)
        const appError = isAppError(error) ? error : {
          kind: 'unknown' as const,
          message: error?.message || 'SSO login failed'
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

    logout: () => {
      console.log('🔄 [TQ Auth] Logging out...')
      clearSession()

      // Clear both storage systems to prevent conflicts
      try {
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('auth.session')
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
      // Don't try to read from manual session storage - just rely on Zustand persist
      const state = get()

      console.log('🔄 [TQ Auth] Initializing auth state...', {
        hasToken: !!state.token,
        hasTenantId: !!state.tenantId,
        hasUser: !!state.user
      })

      if (state.token && state.tenantId && state.user) {
        console.log('🔄 [TQ Auth] Restoring session from Zustand persist')

        set({
          isAuthenticated: true,
          isHydrated: true,
          isLoading: true
        })

        // Load fresh profile data only if we don't have tenant name (not from SSO)
        const { loadUserProfile } = get()
        if (!state.tenantName || state.tenantName.startsWith('Tenant ')) {
          console.log('🔄 [TQ Auth] Loading profile to get tenant info...')
          loadUserProfile()
            .catch(console.error)
            .finally(() => {
              set({ isLoading: false })
            })
        } else {
          console.log('✅ [TQ Auth] Tenant info already available from JWT, skipping profile load')
          set({ isLoading: false })
        }
      } else {
        console.log('🔄 [TQ Auth] No session found, starting fresh')

        set({
          isHydrated: true,
          isLoading: false
        })
      }
    }
  }),
  {
    name: 'auth-storage', // Same storage key as Hub for unified session
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