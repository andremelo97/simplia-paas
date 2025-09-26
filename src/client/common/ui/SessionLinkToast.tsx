import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SessionLinkToastProps {
  show: boolean
  sessionNumber: string
  sessionId: string
  onClose: () => void
  type?: 'session' | 'quote'
  duration?: number // em millisegundos, default 10000
}

export const SessionLinkToast: React.FC<SessionLinkToastProps> = ({
  show,
  sessionNumber,
  sessionId,
  onClose,
  type = 'session',
  duration = 10000
}) => {
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(duration / 1000)

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
    const path = type === 'session'
      ? `/sessions/${sessionId}/edit`
      : `/quotes/${sessionId}/edit`

    navigate(path)
    onClose()
  }

  const getTypeText = () => {
    return type === 'session' ? 'Session' : 'Quote'
  }

  const getActionText = () => {
    return type === 'session' ? 'Edit Session' : 'Edit Quote'
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] w-full"
        >
          <div
            className="w-full bg-white border-b border-gray-200 shadow-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleClick}
            style={{
              backgroundColor: 'var(--brand-tertiary-bg)',
              borderColor: 'var(--brand-tertiary)',
              marginTop: 0,
              paddingTop: '1rem'
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Left side: Success icon + message */}
              <div className="flex items-center gap-3">
                <CheckCircle
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: 'var(--brand-tertiary)' }}
                />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {getTypeText()} {sessionNumber} created successfully!
                  </span>
                  <span className="text-gray-600">
                    Click to {getActionText().toLowerCase()}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Right side: Countdown + close */}
              <div className="flex items-center gap-3">
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}