import React from 'react'
import { Home, Plus, FileText, Users, Receipt, FileType, Share2, ClipboardList, Settings } from 'lucide-react'
import { useUIStore, useAuthStore } from '../store'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'
import { useTranslation } from 'react-i18next'

export const Sidebar: React.FC = () => {
  const { t } = useTranslation('tq')
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const navigation: NavigationItem[] = [
    {
      name: t('sidebar.home'),
      href: '/',
      icon: Home
    },
    // New Session - only for manager and admin (hide from operations)
    ...(user?.role !== 'operations' ? [{
      name: t('sidebar.new_session'),
      href: '/new-session',
      icon: Plus
    }] : []),
    {
      name: t('sidebar.patients'),
      href: '/patients',
      icon: Users
    },
    {
      name: t('sidebar.sessions'),
      href: '/sessions',
      icon: FileText
    },
    {
      name: t('sidebar.quotes'),
      href: '/quotes',
      icon: Receipt
    },
    {
      name: t('sidebar.clinical_reports'),
      href: '/clinical-reports',
      icon: ClipboardList
    },
    {
      name: t('sidebar.templates'),
      href: '/templates',
      icon: FileType
    },
    {
      name: t('sidebar.public_quotes'),
      href: '/public-quotes',
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

  return (
    <CommonSidebar
      navigation={navigation}
      isOpen={sidebarOpen}
      onToggle={toggleSidebar}
      title="TQ"
      subtitle="Transcription & Quote"
    />
  )
}