import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Sparkles, X } from 'lucide-react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../store/ui'
import { useAuthStore } from '../store/auth'
import { useOnboardingStore } from '../store/onboarding'
import { FeedbackHost } from '@client/common/feedback'
import { TQOnboardingWizard } from '../../components/onboarding/TQOnboardingWizard'

export const Layout: React.FC = () => {
  const { t } = useTranslation('tq')
  const { sidebarOpen } = useUIStore()
  const { user } = useAuthStore()
  const { showResumeHint, openWizard, hideResumeHint } = useOnboardingStore()
  const location = useLocation()

  // Configurations page needs full height without padding (like Hub)
  const isConfigurationsPage = location.pathname.startsWith('/configurations')
  const isAdmin = user?.role === 'admin'

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden print:block print:h-auto print:overflow-visible">
      {/* Sidebar - hidden in print */}
      <div className="h-full print:hidden">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        <Header />

        <main className={`flex-1 ${isConfigurationsPage ? 'overflow-hidden relative' : 'overflow-y-auto overflow-x-visible'}`}>
          {isConfigurationsPage ? (
            <Outlet />
          ) : (
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Floating Resume Wizard Button (admin only, when navigated away from wizard) */}
      {isAdmin && showResumeHint && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  {t('onboarding.resume.title', 'Continue Setup?')}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('onboarding.resume.description', 'Resume the setup assistant when ready.')}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={openWizard}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#B725B7] rounded-md hover:bg-[#9a1f9a] transition-colors"
                  >
                    {t('onboarding.resume.button', 'Resume')}
                  </button>
                  <button
                    onClick={hideResumeHint}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {t('onboarding.resume.dismiss', 'Dismiss')}
                  </button>
                </div>
              </div>
              <button
                onClick={hideResumeHint}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Feedback Host */}
      <FeedbackHost />

      {/* Onboarding Wizard (admin-only) */}
      <TQOnboardingWizard />
    </div>
  )
}