import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../shared/store'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Alert,
  AlertDescription
} from '@client/common/ui'
import { consumeSso, hasSsoParams } from '../../lib/consumeSso'

const HUB_LOGIN_URL = import.meta.env.VITE_HUB_LOGIN_URL || 'http://localhost:3003/login'

export const Login: React.FC = () => {
  const { t } = useTranslation('tq')
  const [isSsoLoading, setIsSsoLoading] = useState(false)
  const { isAuthenticated, isLoading, error, clearError } = useAuthStore()

  useEffect(() => {
    clearError()

    const attemptSso = async () => {
      const hasParams = hasSsoParams()

      if (!hasParams) {
        return
      }

      setIsSsoLoading(true)
      try {
        const ssoAttempted = await consumeSso()
        if (ssoAttempted) {
          return
        }
      } catch (err) {
        console.error('SSO login failed:', err)
      } finally {
        setIsSsoLoading(false)
      }
    }

    attemptSso()
  }, [clearError])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleGoToHub = () => {
    window.location.href = HUB_LOGIN_URL
  }

  const showLoadingState = isSsoLoading || isLoading

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto w-full max-w-[380px]"
      >
        <Card className="min-h-[360px] flex flex-col justify-between">
          <CardHeader className="text-center space-y-3 p-8 pb-4">
            <div className="flex justify-center mb-2">
              <img
                src="/logo-512x256.png"
                alt="LivoCare"
                className="h-12"
              />
            </div>

            <CardTitle className="text-2xl font-semibold text-stone-900">
              {t('app_name')}
            </CardTitle>
            <CardDescription className="text-sm text-stone-700">
              Go to the Hub login page to restart your session.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            {/* Legacy manual login form is intentionally disabled to keep authentication centralized in the Hub */}

            <div className="space-y-3 text-center">
              <p className="text-sm text-stone-600">
                Access to TQ is now handled exclusively through the Hub. Use the button below to renew your session.
              </p>

              <Button
                type="button"
                variant="primary"
                style={{ width: '100%' }}
                isLoading={showLoadingState}
                disabled={showLoadingState}
                onClick={handleGoToHub}
              >
                {showLoadingState ? 'Opening Hub…' : 'Go to Hub Login'}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" role="alert" aria-live="polite">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
