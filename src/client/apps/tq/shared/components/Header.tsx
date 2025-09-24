import React from 'react'
import { useAuthStore } from '../store/auth'
import { authService } from '../../services/auth'
import { Header as CommonHeader } from '@client/common/components'

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || pathname === '/') {
    return [{ label: 'Home', href: '/' }]
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' }
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
  const { user } = useAuthStore()

  const handleLogout = () => {
    authService.logout()
  }

  return (
    <CommonHeader
      user={user}
      tenant={null}
      onLogout={handleLogout}
      getBreadcrumbs={getBreadcrumbs}
      getDisplayRole={getDisplayRole}
      showSearch={false} // TQ doesn't need search initially
      showNotifications={false} // TQ doesn't need notifications initially
    />
  )
}