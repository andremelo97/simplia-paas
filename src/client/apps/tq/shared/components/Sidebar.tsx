import React from 'react'
import { Home, Plus, FileText, Users, Receipt } from 'lucide-react'
import { useUIStore } from '../store/ui'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'

const navigation: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  },
  {
    name: 'New session',
    href: '/new-session',
    icon: Plus
  },
  {
    name: 'Sessions',
    href: '/sessions',
    icon: FileText
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: Users
  },
  {
    name: 'Quotes',
    href: '/quotes',
    icon: Receipt
  }
]

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

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