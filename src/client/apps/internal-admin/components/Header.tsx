import React from 'react'
import { useAuthStore, useUIStore } from '../store'
import { authService } from '../services/auth'
import { getDisplayRole } from '../features/users/types'
import { Header as CommonHeader } from '@client/common/components'

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return [{ label: 'Dashboard', href: '/' }]
  }
  
  const breadcrumbs = [
    { label: 'Dashboard', href: '/' }
  ]
  
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
      case 'entitlements': return 'Entitlements'
      case 'licenses': return 'Licenses'
      case 'audit': return 'Audit'
      case 'create': return 'Create'
      case 'edit': return 'Edit'
      default: return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
  }
  
  segments.forEach((segment, index) => {
    // Skip numeric IDs and UUIDs - never show them in breadcrumbs
    if (isId(segment)) {
      return
    }
    
    // For users routes, handle special cases
    if (segments[0] === 'tenants' && segments[2] === 'users') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Tenants', href: '/tenants' })
      } else if (index === 2) {
        breadcrumbs.push({ label: 'Users', href: '#' })
      }
      return
    }
    
    // For tenant edit routes: /tenants/:id/edit -> Dashboard > Tenants > Edit
    if (segments[0] === 'tenants' && segments[2] === 'edit') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Tenants', href: '/tenants' })
      }
      return
    }

    // For tenant licenses routes: /tenants/:id/licenses -> Dashboard > Tenants > Licenses
    if (segments[0] === 'tenants' && segments[2] === 'licenses') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Tenants', href: '/tenants' })
      } else if (index === 2) {
        breadcrumbs.push({ label: 'Licenses', href: '#' })
      }
      return
    }

    // For user edit routes: /tenants/:tenantId/users/:userId/edit -> Dashboard > Tenants > Users
    if (segments.length >= 5 && segments[0] === 'tenants' && segments[2] === 'users' && segments[4] === 'edit') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Tenants', href: '/tenants' })
      } else if (index === 2) {
        breadcrumbs.push({ label: 'Users', href: '#' })
      }
      return
    }
    
    // Default case: add non-ID segments as breadcrumbs
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = mapSegmentToLabel(segment)
    breadcrumbs.push({ label, href })
  })
  
  return breadcrumbs
}

export const Header: React.FC = () => {
  const { user } = useAuthStore()
  const { currentTenant } = useUIStore()

  const handleLogout = () => {
    authService.logout()
  }

  return (
    <CommonHeader
      user={user}
      tenant={currentTenant}
      onLogout={handleLogout}
      getBreadcrumbs={getBreadcrumbs}
      getDisplayRole={getDisplayRole}
      showSearch={false}
      showNotifications={false}
    />
  )
}