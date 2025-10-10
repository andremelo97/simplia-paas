import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { FeedbackHost } from '@client/common/feedback'
import { useAuthStore } from './store/auth'
import { installTenantInterceptor } from '@client/common/auth/interceptor'
import i18n from '@client/common/i18n'
import '../../index.css'

// Initialize tenant interceptor
installTenantInterceptor()

// Initialize auth store
useAuthStore.getState().initialize()

// i18n language sync component
function I18nSync() {
  const tenantLocale = useAuthStore((state) => state.tenantLocale)

  useEffect(() => {
    if (tenantLocale) {
      // Map locale: pt-BR stays pt-BR, everything else becomes en-US
      const language = tenantLocale === 'pt-BR' ? 'pt-BR' : 'en-US'
      i18n.changeLanguage(language)
    }
  }, [tenantLocale])

  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nSync />
    <RouterProvider router={router} />
    <FeedbackHost />
  </React.StrictMode>
)