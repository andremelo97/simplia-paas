import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'
import { useUIStore } from '../store'
import { FeedbackHost } from '@client/common/feedback'

export const AdminLayout: React.FC = () => {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto overflow-x-visible">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* Global Feedback Host */}
      <FeedbackHost />
    </div>
  )
}