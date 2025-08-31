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
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'Tenants',
    href: '/tenants',
    icon: Building2,
    description: 'Manage client organizations'
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    description: 'User management'
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: Grid3x3,
    description: 'App catalog and licenses'
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
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <motion.div 
          className="flex items-center space-x-3"
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-2 bg-black rounded-xl">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="font-semibold text-gray-900">Simplia Admin</h1>
              <p className="text-xs text-gray-500">Internal Tools</p>
            </div>
          )}
        </motion.div>
        
        {!sidebarOpen && (
          <div className="flex justify-center w-full">
            <div className="p-2 bg-black rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center rounded-xl p-3 text-sm font-medium transition-all duration-200",
                  "hover:bg-gray-50 active:scale-[0.98]",
                  isActive 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "text-gray-700 hover:text-gray-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="ml-3 flex-1"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className={cn(
                        "text-xs mt-0.5",
                        isActive ? "text-gray-300" : "text-gray-500"
                      )}>
                        {item.description}
                      </div>
                    </motion.div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Toggle Button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center justify-center p-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95",
            sidebarOpen ? "justify-start" : "justify-center"
          )}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="ml-2 text-sm font-medium">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  )
}