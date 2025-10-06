import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, ExternalLink, Copy, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LinkToastProps {
  show: boolean
  itemNumber: string
  itemId: string
  onClose: () => void
  type?: 'session' | 'quote' | 'clinical-report' | 'public-quote'
  duration?: number // em millisegundos, default 10000
  publicUrl?: string // For public-quote type
  password?: string // For public-quote type
}

export const LinkToast: React.FC<LinkToastProps> = ({
  show,
  itemNumber,
  itemId,
  onClose,
  type = 'session',
  duration = 10000,
  publicUrl,
  password
}) => {
  const navigate = useNavigate()
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
    // Don't navigate for public-quote type (only shows copy buttons)
    if (type === 'public-quote') return

    let path: string

    if (type === 'session') {
      path = `/sessions/${itemId}/edit`
    } else if (type === 'quote') {
      path = `/quotes/${itemId}/edit`
    } else if (type === 'clinical-report') {
      path = `/clinical-reports/${itemId}/edit`
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
      console.error('Failed to copy:', error)
    }
  }

  const getTypeText = () => {
    if (type === 'session') return 'Session'
    if (type === 'quote') return 'Quote'
    if (type === 'clinical-report') return 'Clinical Report'
    if (type === 'public-quote') return 'Public Quote Link'
    return 'Item'
  }

  const getActionText = () => {
    if (type === 'session') return 'Edit Session'
    if (type === 'quote') return 'Edit Quote'
    if (type === 'clinical-report') return 'Edit Clinical Report'
    if (type === 'public-quote') return 'Copy Link & Password'
    return 'View Item'
  }

  return (
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
              backgroundColor: 'var(--brand-tertiary-bg)',
              borderColor: 'var(--brand-tertiary)',
              cursor: type === 'public-quote' ? 'default' : 'pointer'
            }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                {/* Left side: Success icon + message */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <CheckCircle
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: 'var(--brand-tertiary)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {getTypeText()} created successfully!
                      </span>
                    </div>
                    
                    {type === 'public-quote' ? (
                      /* Public Quote: Show URL and Password with copy buttons */
                      <div className="space-y-2">
                        {publicUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-20 flex-shrink-0">URL:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">{publicUrl}</code>
                            <button
                              onClick={() => handleCopy(publicUrl, 'url')}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                              title="Copy URL"
                            >
                              {copied === 'url' ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        )}
                        {password && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-20 flex-shrink-0">Password:</span>
                            <code className="text-xs bg-yellow-50 px-2 py-1 rounded font-mono font-semibold text-gray-900">{password}</code>
                            <button
                              onClick={() => handleCopy(password, 'password')}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                              title="Copy Password"
                            >
                              {copied === 'password' ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Save the password now - it won't be shown again!
                        </p>
                      </div>
                    ) : (
                      /* Regular types: Show click to navigate */
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {itemNumber} - Click to {getActionText().toLowerCase()}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Countdown + close */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-gray-500">
                    {timeLeft}s
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose()
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}