import React from 'react'
import { ExternalLink, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/auth'
import { hubService } from '../services/hub'

function getTqBaseUrl(): string {
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3005'
  }

  if (hostname.includes('hub.')) {
    return window.location.origin.replace('hub.', 'tq.')
  }

  return 'https://tq.livocare.ai'
}

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation('hub')
  const { user } = useAuthStore()

  const handleOpenTQ = () => {
    const { token, tenantId } = useAuthStore.getState()
    if (token && tenantId) {
      const baseUrl = getTqBaseUrl()
      const tqUrl = `${baseUrl}/?token=${encodeURIComponent(token)}&tenantId=${tenantId}`
      window.location.href = tqUrl
    }
  }

  const hasTQ = user?.allowedApps?.some((app: any) => app.slug === 'tq')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {hasTQ && (
          <button
            onClick={handleOpenTQ}
            className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-gray-500 active:text-[#B725B7] transition-colors"
          >
            <ExternalLink className="w-5 h-5 mb-0.5" />
            <span>{t('mobile.open_tq', 'Open TQ')}</span>
          </button>
        )}
        <button
          onClick={() => hubService.logout()}
          className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-gray-500 active:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span>{t('header.logout', 'Logout')}</span>
        </button>
      </div>
    </nav>
  )
}
