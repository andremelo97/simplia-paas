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

  // Helper function to check if a segment is a numeric ID or UUID
  const isId = (segment: string) => {
    return /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
  }

  // Helper function to map segments to user-friendly labels
  const mapSegmentToLabel = (segment: string) => {
    switch (segment) {
      case 'patients': return 'Patients'
      case 'sessions': return 'Sessions'
      case 'quotes': return 'Quotes'
      case 'clinical-reports': return 'Clinical Reports'
      case 'templates': return 'Templates'
      case 'configurations': return 'Configurations'
      case 'new-session': return 'New Session'
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

    // For patients create route: /patients/create -> Home > Patients > Create
    if (segments[0] === 'patients' && segments[1] === 'create') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Patients', href: '/patients' })
      } else if (index === 1) {
        breadcrumbs.push({ label: 'Create', href: '#' })
      }
      return
    }

    // For patient edit routes: /patients/:id/edit -> Home > Patients > Edit
    if (segments[0] === 'patients' && segments[2] === 'edit') {
      if (index === 0) {
        breadcrumbs.push({ label: 'Patients', href: '/patients' })
      } else if (index === 2) {
        breadcrumbs.push({ label: 'Edit', href: '#' })
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