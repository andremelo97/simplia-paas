import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { useAuthStore } from './shared/store'
import i18n from '@client/common/i18n'

export const TQApp: React.FC = () => {
  const tenantLocale = useAuthStore((state) => state.tenantLocale)

  // Update i18n language when locale changes
  useEffect(() => {
    if (tenantLocale) {
      // Map locale: pt-BR stays pt-BR, everything else becomes en-US
      const language = tenantLocale === 'pt-BR' ? 'pt-BR' : 'en-US'
      i18n.changeLanguage(language)
    }
  }, [tenantLocale])

  return (
    <BrowserRouter>
      <div className="tq-app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}