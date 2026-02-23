import React from 'react'
import { Home, Plus, FileText, Users, Receipt, FileType, Share2, ClipboardList, Shield, Settings, Mic, Package, LogOut, LayoutGrid, Wand2 } from 'lucide-react'
import { useUIStore, useAuthStore, useDocGenWizardStore } from '../store'
import { Sidebar as CommonSidebar, NavigationItem, SidebarAction } from '@client/common/components'
import { useTranslation } from 'react-i18next'

interface TQSidebarProps {
  forceOpen?: boolean
}

export const Sidebar: React.FC<TQSidebarProps> = ({ forceOpen }) => {
  const { t } = useTranslation('tq')
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const { openWizard: openDocGenWizard } = useDocGenWizardStore()

  const navigation: NavigationItem[] = [
    {
      name: t('sidebar.home'),
      href: '/',
      icon: Home
    },
    // Generate Document wizard - only for manager and admin (highlighted)
    ...(user?.role !== 'operations' ? [{
      name: t('sidebar.generate_document', 'Generate Document'),
      href: '#',
      icon: Wand2,
      onClick: openDocGenWizard,
      highlight: true,
    }] : []),
    // New Session - only for manager and admin (hide from operations)
    ...(user?.role !== 'operations' ? [{
      name: t('sidebar.new_session'),
      href: '/new-session',
      icon: Plus
    }] : []),
    {
      name: t('sidebar.sessions'),
      href: '/sessions',
      icon: Mic
    },
    {
      name: t('sidebar.patients'),
      href: '/patients',
      icon: Users
    },
    {
      name: t('sidebar.documents'),
      href: '/documents',
      icon: FileText,
      children: [
        {
          name: t('sidebar.quotes'),
          href: '/documents/quotes',
          icon: Receipt
        },
        {
          name: t('sidebar.clinical_notes'),
          href: '/documents/clinical-notes',
          icon: ClipboardList
        },
        {
          name: t('sidebar.prevention'),
          href: '/documents/prevention',
          icon: Shield
        },
        {
          name: t('sidebar.items'),
          href: '/documents/items',
          icon: Package
        }
      ]
    },
    {
      name: t('sidebar.templates'),
      href: '/templates',
      icon: FileType
    },
    {
      name: t('sidebar.landing_pages'),
      href: '/landing-pages',
      icon: Share2
    }
  ]

  // Add Configurations for admin users only
  if (user?.role === 'admin') {
    navigation.push({
      name: t('sidebar.configurations'),
      href: '/configurations',
      icon: Settings
    })
  }

  const getHubUrl = () => {
    const hubOrigin = import.meta.env.VITE_HUB_ORIGIN
      || (window.location.hostname.includes('tq-test')
        ? 'https://hub-test.livocare.ai'
        : 'https://hub.livocare.ai')
    return hubOrigin
  }

  const handleLogout = () => {
    localStorage.removeItem('auth-storage')
    window.location.href = `${getHubUrl()}/login?action=logout`
  }

  const bottomActions: SidebarAction[] = [
    { label: t('sidebar.back_to_hub'), icon: LayoutGrid, onClick: () => window.open(getHubUrl(), '_blank') },
    { label: t('sidebar.logout'), icon: LogOut, onClick: handleLogout, variant: 'danger' },
  ]

  return (
    <CommonSidebar
      navigation={navigation}
      isOpen={forceOpen || sidebarOpen}
      onToggle={toggleSidebar}
      title="TQ"
      subtitle="Transcription & Quote"
      bottomActions={bottomActions}
    />
  )
}
