import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@client/config/http'
import { AppError, isAppError } from '../services/errors/types'

interface User {
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

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: AppError | null
  isHydrated: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
  clearError: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true, // Start with loading true until hydrated
    error: null,
    isHydrated: false,
    
    login: async (credentials) => {
      set({ isLoading: true, error: null })
      try {
        const response = await api.post('/internal/api/v1/platform-auth/login', credentials)
        const result = response // Backend returns { success, message, data: { user, token } }
        
        set({
          isAuthenticated: true,
          user: result.data.user,
          token: result.data.token,
          isLoading: false,
          error: null
        })
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
          isLoading: false,
          error: appError
        })
      }
    },
    
    logout: () => {
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      })
    },
    
    clearError: () => {
      set({ error: null })
    },
    
    setUser: (user) => {
      set({ user })
    },
    
    setToken: (token) => {
      set({ token })
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
    name: 'auth-storage',
    partialize: (state) => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.token
    }),
    onRehydrateStorage: () => (state) => {
      // Auto-initialize after rehydration
      if (state) {
        state.initialize()
      }
    }
  }
))