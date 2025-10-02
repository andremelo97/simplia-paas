import React from 'react'
import { Home, Settings } from 'lucide-react'
import { useUIStore } from '../store/ui'
import { useAuthStore } from '../store/auth'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const navigation: NavigationItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: Home
    }
  ]

  // Add Configurations for admin users only
  if (user?.role === 'admin') {
    navigation.push({
      name: 'Configurations',
      href: '/configurations',
      icon: Settings
    })
  }

  return (
    <CommonSidebar
      navigation={navigation}
      isOpen={sidebarOpen}
      onToggle={toggleSidebar}
      title="Hub"
      subtitle="Application Portal"
    />
  )
}