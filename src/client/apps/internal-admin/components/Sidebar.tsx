import React from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  Grid3x3,
  Clock,
  Settings
} from 'lucide-react'
import { useUIStore } from '../store'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Tenants',
    href: '/tenants',
    icon: Building2
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: Grid3x3
  },
  {
    name: 'Transcription Plans',
    href: '/transcription-plans',
    icon: Clock
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  },
]

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <CommonSidebar
      navigation={navigation}
      isOpen={sidebarOpen}
      onToggle={toggleSidebar}
      title="Internal"
      subtitle="Licensing Management"
    />
  )
}