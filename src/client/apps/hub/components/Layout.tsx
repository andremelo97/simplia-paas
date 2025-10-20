import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../store/ui'

export const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}
    </div>
  )
}