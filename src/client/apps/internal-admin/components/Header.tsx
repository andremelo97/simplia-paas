import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Bell, Search } from 'lucide-react'
import { useAuthStore, useUIStore } from '../store'
import { authService } from '../services/auth'
import { 
  Button, 
  Avatar, 
  AvatarFallback,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@client/common/ui'
import { cn } from '@client/common/utils/cn'

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/' }]
  }
  
  const breadcrumbs = [
    { label: 'Dashboard', href: '/' }
  ]
  
  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    
    // Special handling for tenant edit routes - hide ID and show "Edit"
    if (segments[0] === 'tenants' && segments[2] === 'edit' && index === 1) {
      // Skip the ID segment (index 1) in tenant edit routes
      return
    }
    
    if (segments[0] === 'tenants' && segments[2] === 'edit' && index === 2) {
      // Replace 'edit' with 'Edit' for the last breadcrumb
      breadcrumbs.push({ label: 'Edit', href })
      return
    }
    
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href })
  })
  
  return breadcrumbs
}

export const Header: React.FC = () => {
  const { user } = useAuthStore()
  const { currentTenant } = useUIStore()
  const location = useLocation()
  
  const breadcrumbs = getBreadcrumbs(location.pathname)
  const currentPage = breadcrumbs[breadcrumbs.length - 1]
  const parentBreadcrumbs = breadcrumbs.slice(0, -1)

  const handleLogout = () => {
    authService.logout()
  }

  const getInitials = (firstName?: string) => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase()
    }
    return 'A'
  }

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm"
    >
      <div className="flex h-16 items-center justify-between pr-6">
        {/* Left Side - Breadcrumb - Updated margin */}
        <div className="flex items-center space-x-4 pl-6">
          <Breadcrumb>
            <BreadcrumbList>
              {parentBreadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link 
                        to={crumb.href}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </React.Fragment>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-gray-900">
                  {currentPage.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Tenant Info */}
          {currentTenant && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Tenant: {currentTenant.name}</span>
            </div>
          )}
        </div>

        {/* Right Side - Actions & User */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="w-4 h-4" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-3">
            {/* User Info */}
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.firstName || user?.email?.split('@')[0] || 'Admin'}
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">
                  {user?.role}
                </span>
                {user?.platformRole && (
                  <span className="px-1.5 py-0.5 bg-black text-white rounded font-medium">
                    {user.platformRole}
                  </span>
                )}
              </div>
            </div>
            
            {/* Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-900 text-white text-sm font-medium">
                {getInitials(user?.firstName)}
              </AvatarFallback>
            </Avatar>
            
            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}