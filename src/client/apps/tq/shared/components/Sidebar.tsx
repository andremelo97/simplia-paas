import React from 'react'
import { Home, Plus, FileText, Users, Receipt, FileType, Settings, ClipboardList } from 'lucide-react'
import { useUIStore } from '../store/ui'
import { Sidebar as CommonSidebar, NavigationItem } from '@client/common/components'

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
    name: 'Configurations',
    href: '/configurations',
    icon: Settings
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