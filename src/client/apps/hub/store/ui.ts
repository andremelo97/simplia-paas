import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  configDrawerOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setConfigDrawerOpen: (open: boolean) => void
  toggleConfigDrawer: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  configDrawerOpen: false,

  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),

  setSidebarOpen: (open: boolean) => set({
    sidebarOpen: open
  }),

  setConfigDrawerOpen: (open: boolean) => set({
    configDrawerOpen: open
  }),

  toggleConfigDrawer: () => set((state) => ({
    configDrawerOpen: !state.configDrawerOpen
  }))
}))