import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, ExternalLink, Copy, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface LinkToastProps {
  show: boolean
  itemNumber: string
  itemId: string
  onClose: () => void
  type?: 'session' | 'quote' | 'clinical-report' | 'clinical-note' | 'prevention' | 'landing-page'
  duration?: number // em millisegundos, default 10000
  publicUrl?: string // For landing-page type
  password?: string // For landing-page type
  darkBackground?: boolean // For darker green background (landing-page)
}

export const LinkToast: React.FC<LinkToastProps> = ({
  show,
  itemNumber,
  itemId,
  onClose,
  type = 'session',
  duration = 10000,
  publicUrl,
  password,
  darkBackground = false
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation('tq')
  const [timeLeft, setTimeLeft] = useState(duration / 1000)
  const [copied, setCopied] = useState<'url' | 'password' | null>(null)

  useEffect(() => {
    if (!show) return

    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      onClose()
    }, duration)

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(autoCloseTimer)
      clearInterval(countdownTimer)
    }
  }, [show, duration, onClose])

  useEffect(() => {
    if (show) {
      setTimeLeft(duration / 1000)
    }
  }, [show, duration])

  const handleClick = () => {
    // Don't navigate for landing-page type (only shows copy buttons)
    if (type === 'landing-page') return

    let path: string

    if (type === 'session') {
      path = `/sessions/${itemId}/edit`
    } else if (type === 'quote') {
      path = `/documents/quote/${itemId}/edit`
    } else if (type === 'clinical-report' || type === 'clinical-note') {
      path = `/documents/clinical-note/${itemId}/edit`
    } else if (type === 'prevention') {
      path = `/documents/prevention/${itemId}/edit`
    } else {
      path = '/'
    }

    navigate(path)
    onClose()
  }

  const handleCopy = async (text: string, field: 'url' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      // Failed to copy to clipboard
    }
  }

  const getTypeText = () => {
    if (type === 'session') return t('link_toast.types.session')
    if (type === 'quote') return t('link_toast.types.quote')
    if (type === 'clinical-report' || type === 'clinical-note') return t('link_toast.types.clinical_note')
    if (type === 'prevention') return t('link_toast.types.prevention')
    if (type === 'landing-page') return t('link_toast.types.landing_page')
    return t('link_toast.types.item')
  }

  const getActionText = () => {
    if (type === 'session') return t('link_toast.actions.session')
    if (type === 'quote') return t('link_toast.actions.quote')
    if (type === 'clinical-report' || type === 'clinical-note') return t('link_toast.actions.clinical_note')
    if (type === 'prevention') return t('link_toast.actions.prevention')
    if (type === 'landing-page') return t('link_toast.actions.copy_link_password')
    return t('link_toast.actions.item')
  }

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-0 left-0 right-0 w-full z-[10000]"
          style={{
            margin: 0,
            padding: 0
          }}
        >
          <div
            className="w-full bg-white border-b border-gray-200 shadow-lg p-4 transition-colors"
            onClick={handleClick}
            style={{
              backgroundColor: darkBackground ? '#10b981' : 'var(--brand-tertiary-bg)',
              borderColor: darkBackground ? '#059669' : 'var(--brand-tertiary)',
              cursor: type === 'landing-page' ? 'default' : 'pointer'
            }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                {/* Left side: Success icon + message */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <CheckCircle
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: darkBackground ? '#ffffff' : 'var(--brand-tertiary)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium ${darkBackground ? 'text-white' : 'text-gray-900'}`}>
                        {t('link_toast.created_successfully', { type: getTypeText() })}
                      </span>
                    </div>

                    {type === 'landing-page' ? (
                      /* Landing Page: Show URL and Password with copy buttons */
                      <div className="space-y-2">
                        {publicUrl && (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm w-20 flex-shrink-0 ${darkBackground ? 'text-white' : 'text-gray-600'}`}>
                              {t('link_toast.fields.url')}
                            </span>
                            <code className={`text-xs px-2 py-1 rounded flex-1 truncate ${darkBackground ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-900'}`}>{publicUrl}</code>
                            <button
                              onClick={() => handleCopy(publicUrl, 'url')}
                              className={`p-1.5 rounded transition-colors flex-shrink-0 ${darkBackground ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                              title={t('link_toast.copy.url')}
                            >
                              {copied === 'url' ? (
                                <Check className={`w-4 h-4 ${darkBackground ? 'text-white' : 'text-green-600'}`} />
                              ) : (
                                <Copy className={`w-4 h-4 ${darkBackground ? 'text-white' : 'text-gray-600'}`} />
                              )}
                            </button>
                          </div>
                        )}
                        {password && (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm w-20 flex-shrink-0 ${darkBackground ? 'text-white' : 'text-gray-600'}`}>
                              {t('link_toast.fields.password')}
                            </span>
                            <code className={`text-xs px-2 py-1 rounded font-mono font-semibold ${darkBackground ? 'bg-white text-gray-900' : 'bg-yellow-50 text-gray-900'}`}>{password}</code>
                            <button
                              onClick={() => handleCopy(password, 'password')}
                              className={`p-1.5 rounded transition-colors flex-shrink-0 ${darkBackground ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                              title={t('link_toast.copy.password')}
                            >
                              {copied === 'password' ? (
                                <Check className={`w-4 h-4 ${darkBackground ? 'text-white' : 'text-green-600'}`} />
                              ) : (
                                <Copy className={`w-4 h-4 ${darkBackground ? 'text-white' : 'text-gray-600'}`} />
                              )}
                            </button>
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${darkBackground ? 'text-white/90' : 'text-gray-500'}`}>
                          {t('link_toast.password_notice')}
                        </p>
                      </div>
                    ) : (
                      /* Regular types: Show click to navigate */
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {t('link_toast.navigate_message', { itemNumber, action: getActionText() })}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Countdown + close */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm ${darkBackground ? 'text-white/80' : 'text-gray-500'}`}>
                    {t('link_toast.seconds', { count: timeLeft })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose()
                    }}
                    className={`p-1 rounded transition-colors ${darkBackground ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}
                  >
                    <X className={`w-4 h-4 ${darkBackground ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
