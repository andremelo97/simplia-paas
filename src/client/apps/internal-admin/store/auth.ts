import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@client/config/http'

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
  error: string | null
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
        const response = await api.auth.login(credentials)
        const data = response.data.data // Backend returns { success, message, data: { user, token } }
        
        set({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          isLoading: false,
          error: null
        })
      } catch (error: any) {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: error?.response?.data?.error?.message || error.message || 'Login failed'
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