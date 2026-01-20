import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, HelpCircle, Globe, Plug, ArrowRight, Instagram } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/auth'
import { Button, Input, Alert, AlertDescription, Checkbox } from '@client/common/ui'
import { cn } from '@client/common/utils/cn'
import { AppError, suppressFeedbackCode } from '@client/common/feedback'
import { shouldShowAsBanner, shouldShowFieldErrors } from '@client/common/feedback'
import { hubService } from '../services/hub'

const REMEMBERED_EMAIL_KEY = 'hub-remembered-email'
const LANGUAGE_KEY = 'hub-language'

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' }
] as const

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation('hub')
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [rememberEmail, setRememberEmail] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()

  // Get current language
  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  // Load remembered email and language on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (savedEmail) {
      setCredentials(prev => ({ ...prev, email: savedEmail }))
      setRememberEmail(true)
    }

    // Load saved language preference
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY)
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage)
    }
  }, [i18n])

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem(LANGUAGE_KEY, langCode)
    setShowLanguageMenu(false)
  }

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showLanguageMenu && !target.closest('[data-language-selector]')) {
        setShowLanguageMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLanguageMenu])

  // Auto-rotate slides every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!credentials.email.trim()) {
      errors.email = t('login.email_required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = t('login.email_invalid')
    }

    if (!credentials.password.trim()) {
      errors.password = t('login.password_required')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Get field-level errors from AppError
  const getFieldErrors = (appError: AppError | null): Record<string, string> => {
    if (!appError || !shouldShowFieldErrors(appError.kind)) {
      return {}
    }
    return appError.details || {}
  }

  // Check if we should show banner error
  const shouldShowBannerError = (appError: AppError | null): boolean => {
    return appError !== null && shouldShowAsBanner(appError.kind)
  }

  // Get combined validation + server field errors
  const allFieldErrors = {
    ...validationErrors,
    ...getFieldErrors(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) {
      return
    }

    // Handle remember email
    if (rememberEmail) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, credentials.email)
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY)
    }

    try {
      await login(credentials)
    } catch (error) {
      // Login failed
    }
  }

  const handleInputChange = (field: 'email' | 'password') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }))

    // Clear client-side validation errors
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }

    // Clear server errors on input change to allow retry
    if (error) {
      clearError()
    }

    // Reset forgot password state when email changes
    if (field === 'email') {
      setForgotPasswordSent(false)
    }
  }

  const handleForgotPassword = async () => {
    // Validate email first
    if (!credentials.email.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        email: t('login.forgot_password_email_required')
      }))
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: t('login.email_invalid')
      }))
      return
    }

    setForgotPasswordLoading(true)
    // Suppress toast - we show inline feedback instead
    suppressFeedbackCode('PASSWORD_RESET_SENT')
    try {
      await hubService.forgotPassword(credentials.email)
      setForgotPasswordSent(true)
    } catch (error) {
      // Still show success message for security (don't reveal if email exists)
      setForgotPasswordSent(true)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form (White) */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12 relative">
        {/* Language Selector - Top Right */}
        <div className="absolute top-4 right-4" data-language-selector>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{currentLanguage.flag} {currentLanguage.label}</span>
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors",
                      lang.code === i18n.language && "bg-gray-50 text-[#B725B7]"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('login.welcome_back')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.email')}
              </label>
              <Input
                type="email"
                value={credentials.email}
                onChange={handleInputChange('email')}
                error={allFieldErrors.email}
                placeholder={t('login.email_placeholder')}
                autoComplete="email"
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleInputChange('password')}
                  error={allFieldErrors.password}
                  placeholder={t('login.password_placeholder')}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 transition-colors",
                    "text-gray-400 hover:text-gray-600",
                    "focus:outline-none"
                  )}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Email */}
            <div className="flex items-center">
              <Checkbox
                id="remember-email"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                disabled={isLoading}
              />
              <label
                htmlFor="remember-email"
                className="ml-2 text-sm text-gray-600 cursor-pointer"
              >
                {t('login.remember_email')}
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? t('login.signing_in') : t('login.sign_in')}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              {forgotPasswordSent ? (
                <p className="text-sm text-green-600">
                  {t('login.forgot_password_sent')}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotPasswordLoading || isLoading}
                  className="text-sm text-[#B725B7] hover:text-[#9a1f9a] transition-colors disabled:opacity-50"
                >
                  {forgotPasswordLoading ? t('login.forgot_password_sending') : t('login.forgot_password')}
                </button>
              )}
            </div>
          </form>

          {/* Error Banner */}
          {shouldShowBannerError(error) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-sm">
                  {error?.code === 'TENANT_NOT_FOUND' ? (
                    <span>
                      {t('login.email_not_registered')}{' '}
                      <a
                        href="https://www.livocare.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium hover:text-red-800"
                      >
                        livocare.ai
                      </a>
                    </span>
                  ) : error?.code === 'TENANT_CANCELLED' ? (
                    <span>
                      {t('login.subscription_cancelled')}{' '}
                      <a
                        href="mailto:admin@livocare.ai"
                        className="underline font-medium hover:text-red-800"
                      >
                        admin@livocare.ai
                      </a>
                    </span>
                  ) : (
                    error?.message
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Validation Summary */}
          {error && shouldShowFieldErrors(error.kind) && Object.keys(getFieldErrors(error)).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <Alert
                variant="destructive"
                role="alert"
                aria-live="polite"
                className="flex items-center gap-3"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="flex-1">
                  {error.message}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right Side - Branding (Brand Gradient) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#B725B7] via-[#a020a0] to-[#E91E63] items-center justify-center px-12 relative overflow-hidden">
        {/* Decorative circles with float + breathing animation */}
        <motion.div
          className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white/5"
          animate={{
            y: [0, -40, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/5"
          animate={{
            y: [0, 35, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Slider Container */}
        <div className="relative z-10 w-full max-w-md">
          <AnimatePresence mode="wait">
            {currentSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Logo */}
                <div className="mb-8">
                  <img
                    src="/logo-512x256.png"
                    alt="LivoCare"
                    className="h-20 mx-auto brightness-0 invert"
                  />
                </div>

                {/* Slogan */}
                <h2 className="text-2xl font-light text-white mb-4">
                  {t('login.slogan')}
                </h2>
                <p className="text-white/80 max-w-md mx-auto mb-8">
                  {t('login.slogan_description')}
                </p>

                {/* Website Link */}
                <a
                  href="https://www.livocare.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
                >
                  {t('login.visit_website')}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            )}

            {currentSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Integration Icon */}
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                    <Plug className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Integration Title */}
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('login.integration_title')}
                </h2>
                <p className="text-white/80 max-w-md mx-auto mb-8">
                  {t('login.integration_description')}
                </p>

                {/* Contact CTA */}
                <a
                  href="https://www.livocare.ai/products/tq#contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
                >
                  {t('login.integration_cta')}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            )}

            {currentSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Instagram Icon */}
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                    <Instagram className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Instagram Title */}
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('login.instagram_title')}
                </h2>
                <p className="text-white/80 max-w-md mx-auto mb-8">
                  {t('login.instagram_description')}
                </p>

                {/* Instagram CTA */}
                <a
                  href="https://www.instagram.com/livocare.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
                >
                  {t('login.instagram_cta')}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-2 mt-10">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentSlide === index
                    ? "w-8 bg-white"
                    : "bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Help Link - Bottom */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <a
            href="mailto:admin@livocare.ai"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            {t('login.need_help')}
          </a>
          <p className="text-white/50 text-xs mt-1">
            {t('login.contact_email', { email: 'admin@livocare.ai' })}
          </p>
        </div>
      </div>
    </div>
  )
}
