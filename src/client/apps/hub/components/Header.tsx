import React, { useCallback, useState } from 'react'
import type { TFunction } from 'i18next'
import { useAuthStore } from '../store/auth'
import { hubService } from '../services/hub'
import { Header as CommonHeader } from '@client/common/components'
import { useTranslation } from 'react-i18next'
import { UserSettingsModal } from './UserSettingsModal'

interface BreadcrumbItem {
  label: string
  href: string
}

const buildBreadcrumbs = (pathname: string, t: TFunction<'hub'>): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumbs.home'), href: '/' }
  ]

  if (segments.length === 0) {
    return breadcrumbs
  }

  const isId = (segment: string) => /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

  const mapSegmentToLabel = (segment: string) => {
    const mapping: Record<string, string> = {
      configurations: t('breadcrumbs.configurations'),
      // 'user-configurations': removed - no longer a route (modal opens from header)
      branding: t('breadcrumbs.branding'),
      communication: t('breadcrumbs.communication'),
      transcription: t('breadcrumbs.transcription')
    }
    return mapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  segments.forEach((segment, index) => {
    if (isId(segment)) {
      return
    }

    const href = '/' + segments.slice(0, index + 1).join('/')
    breadcrumbs.push({
      label: mapSegmentToLabel(segment),
      href
    })
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
  const { user, tenantName, tenantSlug } = useAuthStore()
  const { t } = useTranslation('hub')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const localizedBreadcrumbs = useCallback(
    (pathname: string) => buildBreadcrumbs(pathname, t),
    [t]
  )

  const handleLogout = () => {
    hubService.logout()
  }

  const handleUserClick = () => {
    setIsSettingsOpen(true)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  // Create tenant object for header display
  const tenant = tenantName ? {
    name: tenantName,
    slug: tenantSlug || '',
  } : null

  return (
    <>
      <CommonHeader
        user={user}
        tenant={tenant}
        onLogout={handleLogout}
        onUserClick={handleUserClick}
        userTooltip={t('header.user_settings_tooltip')}
        getBreadcrumbs={localizedBreadcrumbs}
        getDisplayRole={getDisplayRole}
        showSearch={false} // Hub doesn't need search
        showNotifications={false} // Hub doesn't need notifications for now
      />

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </>
  )
}
