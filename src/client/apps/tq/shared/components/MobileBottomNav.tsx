import React from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, Mic, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@client/common/utils/cn'

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation('tq')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        <NavLink
          to="/new-session"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors",
              isActive ? "text-[#B725B7]" : "text-gray-500"
            )
          }
        >
          <Plus className="w-5 h-5 mb-0.5" />
          <span>{t('sidebar.new_session')}</span>
        </NavLink>
        <NavLink
          to="/sessions"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors",
              isActive ? "text-[#B725B7]" : "text-gray-500"
            )
          }
        >
          <Mic className="w-5 h-5 mb-0.5" />
          <span>{t('sidebar.sessions')}</span>
        </NavLink>
        <NavLink
          to="/patients"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors",
              isActive ? "text-[#B725B7]" : "text-gray-500"
            )
          }
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>{t('sidebar.patients')}</span>
        </NavLink>
      </div>
    </nav>
  )
}
