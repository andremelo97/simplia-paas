import React, { useEffect, useRef } from 'react'
import { useFeedbackStore } from './store'
import { AppFeedback } from './types'
import { cn } from '../utils/cn'

interface ToastProps {
  feedback: AppFeedback
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ feedback, onClose }) => {
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus management for accessibility
    if (feedback.kind === 'error' && toastRef.current) {
      toastRef.current.focus()
    }
  }, [feedback.kind])

  const getToastStyles = () => {
    const baseStyles = "fixed bottom-4 right-4 max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 z-50 transform transition-all duration-300 ease-in-out"
    
    switch (feedback.kind) {
      case 'success':
        return cn(baseStyles, "border-opacity-30")
      case 'info':
        return cn(baseStyles, "border-blue-200 bg-blue-50")
      case 'warning':
        return cn(baseStyles, "border-yellow-200 bg-yellow-50")
      case 'error':
        return cn(baseStyles, "border-red-200 bg-red-50")
      default:
        return cn(baseStyles, "border-gray-200")
    }
  }
  
  const getToastStyle = () => {
    if (feedback.kind === 'success') {
      return {
        backgroundColor: 'var(--brand-tertiary-bg)',
        borderColor: 'var(--brand-tertiary)',
        color: 'var(--brand-tertiary)'
      }
    }
    return undefined
  }

  const getIconColor = () => {
    switch (feedback.kind) {
      case 'success': return ''
      case 'info': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getIcon = () => {
    switch (feedback.kind) {
      case 'success':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={toastRef}
      className={getToastStyles()}
      style={getToastStyle()}
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      aria-live={feedback.kind === 'error' ? 'assertive' : 'polite'}
      tabIndex={feedback.kind === 'error' ? -1 : undefined}
    >
      <div className="flex items-start">
        <div className={cn("flex-shrink-0", getIconColor())} style={feedback.kind === 'success' ? {color: 'var(--brand-tertiary)'} : undefined}>
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          {feedback.title && (
            <p className="text-sm font-medium text-gray-900">
              {feedback.title}
            </p>
          )}
          <p className={cn("text-sm", feedback.title ? "text-gray-500" : "text-gray-900")}>
            {feedback.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-primary)]"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

interface BannerProps {
  feedback: AppFeedback
  onClose: () => void
}

const Banner: React.FC<BannerProps> = ({ feedback, onClose }) => {
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus management for global errors
    if (bannerRef.current) {
      bannerRef.current.focus()
    }
  }, [])

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            {feedback.title && (
              <p className="font-medium">{feedback.title}</p>
            )}
            <p className={feedback.title ? "text-red-100" : undefined}>
              {feedback.message}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-red-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export const FeedbackHost: React.FC = () => {
  const { feedbacks, dequeue } = useFeedbackStore()

  // Separate global errors (banners) from toasts
  const globalErrors = feedbacks.filter(f => f.kind === 'error' && !f.path?.includes('field'))
  const toasts = feedbacks.filter(f => f.kind !== 'error' || f.path?.includes('field'))

  return (
    <>
      {/* Global error banners */}
      {globalErrors.map(feedback => (
        <Banner
          key={feedback.id}
          feedback={feedback}
          onClose={() => dequeue(feedback.id)}
        />
      ))}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map(feedback => (
          <Toast
            key={feedback.id}
            feedback={feedback}
            onClose={() => dequeue(feedback.id)}
          />
        ))}
      </div>
    </>
  )
}
