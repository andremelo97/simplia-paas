import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  currentTenant: {
    id: number
    name: string
    schema: string
  } | null
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: number
  }>
  isLoading: boolean
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setCurrentTenant: (tenant: { id: number; name: string; schema: string } | null) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  theme: 'light',
  currentTenant: null,
  notifications: [],
  isLoading: false,

  toggleSidebar: () => {
    set({ sidebarOpen: !get().sidebarOpen })
  },

  setTheme: (theme) => {
    set({ theme })
  },

  setCurrentTenant: (tenant) => {
    set({ currentTenant: tenant })
  },

  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now()
    }
    set({ notifications: [...get().notifications, newNotification] })
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(newNotification.id)
    }, 5000)
  },

  removeNotification: (id) => {
    set({ 
      notifications: get().notifications.filter(notification => notification.id !== id)
    })
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  }
}))