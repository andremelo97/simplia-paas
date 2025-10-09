import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../store/ui'
import { FeedbackHost } from '@client/common/feedback'

export const Layout: React.FC = () => {
  const { sidebarOpen } = useUIStore()
  const location = useLocation()
  
  // Configurations page needs full height without padding (like Hub)
  const isConfigurationsPage = location.pathname === '/configurations'

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className={`flex-1 ${isConfigurationsPage ? 'overflow-hidden relative' : 'overflow-y-auto overflow-x-visible'}`}>
          {isConfigurationsPage ? (
            <Outlet />
          ) : (
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Global Feedback Host */}
      <FeedbackHost />
    </div>
  )
}