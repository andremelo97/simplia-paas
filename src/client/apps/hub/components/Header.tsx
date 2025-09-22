import React from 'react'
import { useAuthStore } from '../store/auth'
import { hubService } from '../services/hub'
import { Header as CommonHeader } from '@client/common/components'

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: 'Home', href: '/' }]
  }
  
  const breadcrumbs = [
    { label: 'Home', href: '/' }
  ]
  
  // For Hub app, we likely won't have complex nested routes
  // but we can extend this as needed
  return breadcrumbs
}

const getDisplayRole = (user: any) => {
  if (user?.userType?.slug) {
    return user.userType.slug.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }
  return user?.role || 'User'
}

export const Header: React.FC = () => {
  const { user, tenantName, tenantSlug } = useAuthStore()

  const handleLogout = () => {
    hubService.logout()
  }

  // Create tenant object for header display
  const tenant = tenantName ? {
    name: tenantName,
    slug: tenantSlug || '',
  } : null

  return (
    <CommonHeader
      user={user}
      tenant={tenant}
      onLogout={handleLogout}
      getBreadcrumbs={getBreadcrumbs}
      getDisplayRole={getDisplayRole}
      showSearch={false} // Hub doesn't need search
      showNotifications={false} // Hub doesn't need notifications for now
    />
  )
}