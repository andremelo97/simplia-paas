import React from 'react'
import { Home, Plus, FileText, Users, Receipt, FileType, Share2, ClipboardList, Settings } from 'lucide-react'
import { useUIStore, useAuthStore } from '../store'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const navigation: NavigationItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: Home
    },
    {
      name: 'New Session',
      href: '/new-session',
      icon: Plus
    },
    {
      name: 'Patients',
      href: '/patients',
      icon: Users
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: FileText
    },
    {
      name: 'Quotes',
      href: '/quotes',
      icon: Receipt
    },
    {
      name: 'Clinical Reports',
      href: '/clinical-reports',
      icon: ClipboardList
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileType
    },
    {
      name: 'Public Quotes',
      href: '/public-quotes',
      icon: Share2
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
      title="TQ"
      subtitle="Transcription Quote"
    />
  )
}