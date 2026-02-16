import React, { useCallback, useState } from 'react'
import type { TFunction } from 'i18next'
import { useAuthStore } from '../store/auth'
import { useOnboardingStore } from '../store/onboarding'
import { hubService } from '../services/hub'
import { Header as CommonHeader } from '@client/common/components'
import { useTranslation } from 'react-i18next'
import { UserSettingsModal } from './UserSettingsModal'
import { BugReportModal } from './BugReportModal'
import { HelpCircle, Bug, Headphones } from 'lucide-react'
import { Button, Tooltip, SupportModal } from '@client/common/ui'

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

interface HubHeaderProps {
  onMenuToggle?: () => void
}

export const Header: React.FC<HubHeaderProps> = ({ onMenuToggle }) => {
  const { user, tenantName, tenantSlug } = useAuthStore()
  const { openWizard } = useOnboardingStore()
  const { t } = useTranslation('hub')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isBugReportOpen, setIsBugReportOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)

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

  // Only show help button for admin users
  const showHelpButton = user?.role === 'admin'

  // Right actions for the header (support + bug report + help)
  const rightActions = (
    <div className="flex items-center gap-1">
      {/* Support Button */}
      <Tooltip content={t('header.support_tooltip', 'Suporte')} side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSupportOpen(true)}
          className="text-gray-500 hover:text-[#5ED6CE] transition-colors"
        >
          <Headphones className="w-5 h-5" />
        </Button>
      </Tooltip>

      {/* Bug Report Button */}
      <Tooltip content={t('header.bug_report_tooltip', 'Report a Bug')} side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsBugReportOpen(true)}
          className="text-gray-500 hover:text-[#E91E63] transition-colors"
        >
          <Bug className="w-5 h-5" />
        </Button>
      </Tooltip>

      {/* Help Button (admin only) */}
      {showHelpButton && (
        <Tooltip content={t('header.help_tooltip', 'Setup Assistant')} side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={openWizard}
            className="text-gray-500 hover:text-[#B725B7] transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </Tooltip>
      )}
    </div>
  )

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
        showSearch={false}
        showNotifications={false}
        rightActions={rightActions}
        onMenuToggle={onMenuToggle}
      />

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />

      <BugReportModal
        isOpen={isBugReportOpen}
        onClose={() => setIsBugReportOpen(false)}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </>
  )
}
