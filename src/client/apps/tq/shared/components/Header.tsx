import React from 'react'
import { useAuthStore } from '../store/auth'
import { authService } from '../../services/auth'
import { Header as CommonHeader } from '@client/common/components'

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || pathname === '/app') {
    return [{ label: 'Home', href: '/app' }]
  }

  const breadcrumbs = [
    { label: 'Home', href: '/app' }
  ]

  // For TQ app, extend breadcrumbs as features are added
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
    authService.logout()
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
      showSearch={false} // TQ doesn't need search initially
      showNotifications={false} // TQ doesn't need notifications initially
    />
  )
}