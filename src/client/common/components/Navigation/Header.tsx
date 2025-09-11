import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Bell, Search } from 'lucide-react'
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

interface User {
  id: number
  firstName?: string
  lastName?: string
  email: string
  role?: string
  platformRole?: string
}

interface Tenant {
  id: number
  name: string
  subdomain: string
}

interface BreadcrumbItem {
  label: string
  href: string
}

export interface HeaderProps {
  user?: User | null
  tenant?: Tenant | null
  onLogout: () => void
  getBreadcrumbs?: (pathname: string) => BreadcrumbItem[]
  showSearch?: boolean
  showNotifications?: boolean
  className?: string
  getDisplayRole?: (user: User) => string
}

const defaultGetBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: 'Home', href: '/' }]
  }
  
  const breadcrumbs = [{ label: 'Home', href: '/' }]
  
  // Helper function to check if a segment is a numeric ID or UUID
  const isId = (segment: string) => {
    return /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
  }

  // Helper function to map segments to user-friendly labels
  const mapSegmentToLabel = (segment: string) => {
    switch (segment) {
      case 'tenants': return 'Tenants'
      case 'users': return 'Users'
      case 'applications': return 'Applications'
      case 'apps': return 'Apps'
      case 'entitlements': return 'Entitlements'
      case 'licenses': return 'Licenses'
      case 'audit': return 'Audit'
      case 'create': return 'Create'
      case 'edit': return 'Edit'
      case 'account': return 'Account'
      case 'profile': return 'Profile'
      default: return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
  }
  
  segments.forEach((segment, index) => {
    // Skip numeric IDs and UUIDs - never show them in breadcrumbs
    if (isId(segment)) {
      return
    }
    
    // Default case: add non-ID segments as breadcrumbs
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = mapSegmentToLabel(segment)
    breadcrumbs.push({ label, href })
  })
  
  return breadcrumbs
}

const defaultGetDisplayRole = (user: User): string => {
  if (user.platformRole === 'internal_admin') return 'Platform Admin'
  if (user.role === 'admin') return 'Admin'
  if (user.role === 'manager') return 'Manager'
  if (user.role === 'operations') return 'Operations'
  return 'User'
}

export const Header: React.FC<HeaderProps> = ({
  user,
  tenant,
  onLogout,
  getBreadcrumbs = defaultGetBreadcrumbs,
  showSearch = true,
  showNotifications = true,
  className,
  getDisplayRole = defaultGetDisplayRole
}) => {
  const location = useLocation()
  
  const breadcrumbs = getBreadcrumbs(location.pathname)
  const currentPage = breadcrumbs[breadcrumbs.length - 1]
  const parentBreadcrumbs = breadcrumbs.slice(0, -1)

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.firstName) {
      return user.firstName
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between pr-6">
        {/* Left Side - Breadcrumb */}
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
          {tenant && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Tenant: {tenant.name}</span>
            </div>
          )}
        </div>

        {/* Right Side - Actions & User */}
        <div className="flex items-center space-x-3">
          {/* Search Button */}
          {showSearch && (
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="w-4 h-4" />
            </Button>
          )}
          
          {/* Notifications */}
          {showNotifications && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </Button>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-3">
            {/* User Info */}
            {user && (
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {getUserDisplayName()}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    user.platformRole === 'internal_admin' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {getDisplayRole(user)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-900 text-white text-sm font-medium">
                {getInitials(user?.firstName, user?.lastName, user?.email)}
              </AvatarFallback>
            </Avatar>
            
            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
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