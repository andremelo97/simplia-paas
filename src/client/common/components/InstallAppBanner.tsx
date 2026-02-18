import React, { useState, useEffect } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
}

interface InstallAppBannerProps {
  ignoreDismiss?: boolean
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ ignoreDismiss = false }) => {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    if (!ignoreDismiss) {
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return
    }

    // iOS: show manual instructions
    if (isIOS()) {
      setIsIOSDevice(true)
      setShowBanner(true)
      return
    }

    // Android/Chrome: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [ignoreDismiss])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  if (!showBanner) return null

  // iOS banner - manual instructions
  if (isIOSDevice) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 md:hidden">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {t('common:pwa.install_title', 'Install App')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('common:pwa.ios_instructions', 'Tap ⋯ in the toolbar, then')} <Share className="w-3 h-3 inline" /> {t('common:pwa.ios_instructions_then', 'Share, scroll down and tap "Add to Home Screen"')}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome banner - install button
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 md:hidden">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {t('common:pwa.install_title', 'Install App')}
          </p>
          <p className="text-xs text-gray-500">
            {t('common:pwa.install_description', 'Add to your home screen for quick access')}
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-[#B725B7] rounded-md hover:bg-[#9a1f9a] transition-colors"
        >
          {t('common:pwa.install_button', 'Install')}
        </button>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
