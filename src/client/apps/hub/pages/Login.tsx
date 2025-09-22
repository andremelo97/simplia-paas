import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Building2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { Button, Input, Card, CardHeader, CardContent, CardTitle, CardDescription, Alert, AlertDescription } from '@client/common/ui'
import { cn } from '@client/common/utils/cn'
import { AppError } from '@client/common/feedback'
import { shouldShowAsBanner, shouldShowFieldErrors } from '@client/common/feedback'
import { publishFeedback, resolveFeedbackMessage } from '@client/common/feedback'

export const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore()
  const location = useLocation()

  // Always redirect to home after login
  const from = '/'

  useEffect(() => {
    clearError()
  }, [clearError])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!credentials.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!credentials.password.trim()) {
      errors.password = 'Password is required'
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

    if (!validateForm()) {
      return
    }

    try {
      await login(credentials)
    } catch (error) {
      console.error('Login failed:', error)
      // Error is already set in the auth store by the login function
      // Don't do anything else here - let the UI render the error
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
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#B725B7] via-purple-500 to-[#E91E63] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-[380px]"
      >
        <Card className="min-h-[540px]">
          <CardHeader className="text-center space-y-3 p-8 pb-4">
            {/* Logo */}
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-stone-50 rounded-xl">
                <Building2 className="w-8 h-8 text-stone-600" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-semibold text-stone-900">
              Sign in to continue
            </CardTitle>
            <CardDescription className="text-sm text-stone-700">
              Access your applications portal
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column' }}>
                <Input
                  label="Email"
                  type="email"
                  value={credentials.email}
                  onChange={handleInputChange('email')}
                  error={allFieldErrors.email}
                  placeholder="your.email@company.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full"
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={handleInputChange('password')}
                    error={allFieldErrors.password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full pr-8"
                  />
                  <button
                    type="button"
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 transition-colors",
                      "text-gray-300 hover:text-gray-500",
                      "focus:outline-none",
                      "flex items-center justify-center w-4 h-4 opacity-60"
                    )}
                    style={{
                      top: 'calc(50% + 12px)',
                      right: '8px'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  style={{ width: '100%' }}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>
            </form>

            {shouldShowBannerError(error) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  variant="destructive" 
                  role="alert" 
                  aria-live="polite"
                  className="flex items-center gap-3 alert-destructive"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="flex-1">
                    {error?.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {/* Show validation summary if there are field errors from server */}
            {error && shouldShowFieldErrors(error.kind) && Object.keys(getFieldErrors(error)).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  variant="destructive" 
                  role="alert" 
                  aria-live="polite"
                  className="flex items-center gap-3 alert-destructive"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="flex-1">
                    {error.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}