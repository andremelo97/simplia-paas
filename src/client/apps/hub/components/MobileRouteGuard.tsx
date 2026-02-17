import React from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Monitor } from 'lucide-react'
import { useDeviceType } from '@shared/hooks/use-device-type'

const MOBILE_ALLOWED_PATTERNS = [
  /^\/$/
]

export const MobileRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const device = useDeviceType()
  const location = useLocation()
  const { t } = useTranslation('hub')

  if (device !== 'mobile') {
    return <>{children}</>
  }

  const isAllowed = MOBILE_ALLOWED_PATTERNS.some(pattern => pattern.test(location.pathname))

  if (isAllowed) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Monitor className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {t('mobile.desktop_only_title')}
      </h2>
      <p className="text-sm text-gray-500 max-w-xs">
        {t('mobile.desktop_only_description')}
      </p>
    </div>
  )
}
