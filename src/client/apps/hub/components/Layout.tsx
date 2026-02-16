import React, { useState, useCallback, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useOnboardingStore } from '../store/onboarding'
import { useAuthStore } from '../store/auth'
import { HubOnboardingWizard } from './onboarding/HubOnboardingWizard'
import { useTranslation } from 'react-i18next'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@client/common/ui'
import { useIsMobile } from '@shared/hooks/use-mobile'

export const Layout: React.FC = () => {
  const { showResumeHint, openWizard, hideResumeHint } = useOnboardingStore()
  const { user } = useAuthStore()
  const { t } = useTranslation('hub')
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isMobile = useIsMobile(768)
  const isAdmin = user?.role === 'admin'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {/* Sidebar - desktop only (lg+) */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile/Tablet sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar forceOpen />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={handleMenuToggle} />

        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>

      {/* Floating Resume Wizard Button (not on mobile) */}
      {isAdmin && showResumeHint && !isMobile && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.resume.title', 'Continue Setup?')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('onboarding.resume.description', 'Resume the setup assistant when ready.')}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => openWizard()}
                    className="bg-[#B725B7] hover:bg-[#9a1f9a] text-white text-xs px-3 py-1"
                  >
                    {t('onboarding.resume.button', 'Resume')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => hideResumeHint()}
                    className="text-gray-500 text-xs px-2 py-1"
                  >
                    {t('onboarding.resume.dismiss', 'Dismiss')}
                  </Button>
                </div>
              </div>
              <button
                onClick={() => hideResumeHint()}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Wizard (admin-only, not on mobile) */}
      {!isMobile && <HubOnboardingWizard />}
    </div>
  )
}