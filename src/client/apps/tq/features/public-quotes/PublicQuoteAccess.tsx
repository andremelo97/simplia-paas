import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button, Input, Label, Card, CardContent, Select } from '@client/common/ui'
import { Lock, AlertCircle } from 'lucide-react'
import { createConfigWithResolvedData } from './puck-config-preview'
import { api } from '@client/config/http'

interface PublicQuoteData {
  content: {
    template: any // Puck template structure
    resolvedData: any // Pre-resolved quote data from backend
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    tertiaryColor: string
    logo: string | null
    backgroundVideoUrl?: string | null
  }
}

export const PublicQuoteAccess: React.FC = () => {
  const { t, i18n } = useTranslation('tq')
  const { accessToken } = useParams<{ accessToken: string }>()

  type ErrorKey = 'empty' | 'incorrect' | 'not_found' | 'forbidden' | 'default'

  const [language, setLanguage] = useState<'en-US' | 'pt-BR'>('en-US')
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)
  const [quoteData, setQuoteData] = useState<PublicQuoteData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  const languageOptions = useMemo(
    () => [
      { value: 'en-US', label: 'English' },
      { value: 'pt-BR', label: 'Portugu\u00EAs (Brasil)' }
    ],
    []
  )

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value as 'en-US' | 'pt-BR'
    setLanguage(selected)
  }

  const errorMessage = errorKey ? t(`public_quotes.access.errors.${errorKey}`) : null

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setErrorKey('empty')
      return
    }

    setIsVerifying(true)
    setErrorKey(null)

    try {
      const response = await api.post(
        `/api/tq/v1/pq/${accessToken}`,
        { password }
      )

      // The response.data IS the data object from the backend
      setQuoteData(response.data)
      setIsAuthenticated(true)
    } catch (err: any) {
      if (err?.httpStatus === 401 || err?.message?.toLowerCase().includes('password')) {
        setErrorKey('incorrect')
      } else if (err?.httpStatus === 404 || err?.message?.toLowerCase().includes('not found')) {
        setErrorKey('not_found')
      } else if (err?.httpStatus === 403) {
        setErrorKey('forbidden')
      } else {
        setErrorKey('default')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  // Create preview config from saved content package
  // Content package has { template, resolvedData } - already resolved on backend
  const quoteLabels = useMemo(() => ({
    quoteNumber: t('public_quotes.labels.quote_number'),
    total: t('public_quotes.labels.total'),
    noItems: t('public_quotes.labels.items_empty'),
    item: t('public_quotes.labels.item'),
    quantity: t('public_quotes.labels.quantity'),
    price: t('public_quotes.labels.price'),
    discount: t('public_quotes.labels.discount')
  }), [t])

  const footerLabels = useMemo(() => ({
    socialTitle: t('public_quotes.footer.social_title'),
    quickLinksTitle: t('public_quotes.footer.quick_links_title'),
    contactTitle: t('public_quotes.footer.contact_title')
  }), [t])

  const previewConfig = useMemo(() => {
    if (!quoteData?.content || !quoteData?.branding) return null

    const branding = {
      tenantId: 0,
      primaryColor: quoteData.branding.primaryColor,
      secondaryColor: quoteData.branding.secondaryColor,
      tertiaryColor: quoteData.branding.tertiaryColor,
      logoUrl: quoteData.branding.logo || null,
      backgroundVideoUrl: quoteData.branding.backgroundVideoUrl || null,
      companyName: null
    }

    // Use createConfigWithResolvedData directly with the saved resolvedData
    return createConfigWithResolvedData(branding, quoteData.content.resolvedData, {
      labels: quoteLabels,
      footerLabels
    })
  }, [quoteData, quoteLabels, footerLabels])

  // Password entry form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="w-40">
            <Select
              label={t('public_quotes.access.language_label')}
              value={language}
              onChange={handleLanguageChange}
              options={languageOptions}
            />
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                {t('public_quotes.access.heading')}
              </h1>
              <p className="text-center text-gray-600 mb-6">
                {t('public_quotes.access.description')}
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('public_quotes.access.password_label')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrorKey(null)
                    }}
                    placeholder={t('public_quotes.access.password_placeholder')}
                    autoFocus
                    disabled={isVerifying}
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errorMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isVerifying || !password.trim()}
                  isLoading={isVerifying}
                >
                  {isVerifying
                    ? t('public_quotes.access.button_verifying')
                    : t('public_quotes.access.button_access')}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  {t('public_quotes.access.footer_hint')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Loading state while rendering
  if (!previewConfig || !quoteData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('public_quotes.access.loading')}</div>
      </div>
    )
  }

  // Check if template has content
  if (!quoteData.content.template || !quoteData.content.template.content || quoteData.content.template.content.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('public_quotes.access.no_content_title')}</h1>
          <p className="text-gray-600">{t('public_quotes.access.no_content_description')}</p>
        </div>
      </div>
    )
  }

  // Render the public quote with Puck
  // Use the saved template from content package
  return (
    <div className="min-h-screen bg-white">
      <Render config={previewConfig} data={quoteData.content.template} />
    </div>
  )
}





