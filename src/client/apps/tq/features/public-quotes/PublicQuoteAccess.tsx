import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button, Input, Label, Card, CardContent } from '@client/common/ui'
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
  const { t } = useTranslation('tq')
  const { accessToken } = useParams<{ accessToken: string }>()

  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quoteData, setQuoteData] = useState<PublicQuoteData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Please enter the password')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await api.post(
        `/api/tq/v1/pq/${accessToken}`,
        { password }
      )

      console.log('[PublicQuoteAccess] Response:', response)
      
      // The response.data IS the data object from the backend
      setQuoteData(response.data)
      setIsAuthenticated(true)
    } catch (err: any) {
      console.error('[PublicQuoteAccess] Password verification failed:', err)
      
      // Handle different error scenarios
      if (err.httpStatus === 401 || err.message?.toLowerCase().includes('password')) {
        setError('Incorrect password. Please try again.')
      } else if (err.httpStatus === 404 || err.message?.toLowerCase().includes('not found')) {
        setError('This link is not valid or has expired.')
      } else if (err.httpStatus === 403) {
        setError('Access denied to this quote.')
      } else {
        setError('Failed to access quote. Please try again later.')
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
      faviconUrl: null,
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
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Protected Quote
            </h1>
            <p className="text-center text-gray-600 mb-6">
              This quote is password protected. Please enter the password to view.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null) // Clear error when typing
                  }}
                  placeholder={t('public_quotes.placeholders.password')}
                  autoFocus
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isVerifying || !password.trim()}
                isLoading={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Access Quote'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                If you don't have the password, please contact the person who shared this link with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state while rendering
  if (!previewConfig || !quoteData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('public_quotes.loading_quote')}</div>
      </div>
    )
  }

  // Check if template has content
  if (!quoteData.content.template || !quoteData.content.template.content || quoteData.content.template.content.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Content</h1>
          <p className="text-gray-600">This quote template doesn't have any content yet.</p>
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

