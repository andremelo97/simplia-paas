import React from 'react'
import { Home, Settings, ShoppingBag, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../store/ui'
import { useAuthStore } from '../store/auth'
import { hubService } from '../services/hub'
import { Sidebar as CommonSidebar, NavigationItem, SidebarAction } from '@client/common/components'

interface HubSidebarProps {
  forceOpen?: boolean
}

export const Sidebar: React.FC<HubSidebarProps> = ({ forceOpen }) => {
  const { t } = useTranslation('hub')
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const navigation: NavigationItem[] = [
    {
      name: t('sidebar.home'),
      href: '/',
      icon: Home
    },
    {
      name: t('sidebar.marketplace'),
      href: '/marketplace',
      icon: ShoppingBag
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

  const bottomActions: SidebarAction[] = [
    { label: t('sidebar.logout'), icon: LogOut, onClick: () => hubService.logout(), variant: 'danger' },
  ]

  return (
    <CommonSidebar
      navigation={navigation}
      isOpen={forceOpen || sidebarOpen}
      onToggle={toggleSidebar}
      title="Hub"
      subtitle={t('sidebar.application_portal')}
      bottomActions={bottomActions}
    />
  )
}