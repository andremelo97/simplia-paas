import React from 'react'
import { Home, Grid3x3, User } from 'lucide-react'
import { useUIStore } from '../store/ui'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'

const navigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  }
]

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

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