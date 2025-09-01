import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Grid3x3,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useUIStore } from '../store'
import { cn } from '@client/common/utils/cn'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Tenants',
    href: '/tenants',
    icon: Building2
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: Grid3x3
  },
]

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <motion.div
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
      style={{ width: sidebarOpen ? '210px' : '64px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/50 h-16 px-6 shadow-sm bg-white">
        <motion.div 
          className="flex items-center space-x-3"
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {sidebarOpen && (
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-lg text-gray-500">Internal</h1>
                <button
                  onClick={toggleSidebar}
                  className="transition-all hover:bg-purple-50/50 rounded-md p-1"
                  style={{
                    color: '#B725B7',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">Licensing  Management</p>
            </div>
          )}
        </motion.div>
        
        {!sidebarOpen && (
          <div className="flex justify-center w-full">
            <button
              onClick={toggleSidebar}
              className="transition-all hover:bg-purple-50/50 rounded-md p-1"
              style={{ 
                color: '#B725B7',
                background: 'transparent',
                border: 'none',
                outline: 'none'
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1" style={{ padding: '16px', gap: '8px', display: 'flex', flexDirection: 'column' }}>
        {navigation.map((item, index) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              style={({ isActive }) => ({
                color: isActive ? '#B725B7' : '#000000',
                textDecoration: 'none'
              })}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center rounded-xl p-3 text-sm font-medium transition-colors duration-200",
                  "hover:text-[#B725B7] hover:bg-purple-50/50 hover:border hover:border-purple-200/30",
                  isActive && "bg-purple-50/50 border border-purple-200/30",
                  !sidebarOpen && "justify-center"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    className="w-5 h-5"
                    style={{ 
                      color: 'inherit',
                      width: '20px !important',
                      height: '20px !important',
                      minWidth: '20px',
                      minHeight: '20px',
                      flexShrink: 0
                    }}
                  />
                  
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex-1"
                      style={{ marginLeft: '10px' }}
                    >
                      <div className="font-medium text-sm">{item.name}</div>
                    </motion.div>
                  )}

                </>
              )}
            </NavLink>
          )
        })}
      </nav>

    </motion.div>
  )
}