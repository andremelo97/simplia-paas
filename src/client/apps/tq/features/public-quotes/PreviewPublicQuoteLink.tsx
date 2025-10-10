import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Puck, Render } from '@measured/puck'
import { publicQuotesService, PublicQuote } from '../../services/publicQuotes'
import { quotesService } from '../../services/quotes'
import { brandingService, BrandingData } from '../../services/branding'
import { usePublicQuoteRenderer } from '../../hooks/usePublicQuoteRenderer'
import '@measured/puck/puck.css'

/**
 * Preview page for authenticated users to see what patients will see
 * This is a read-only preview within the application context
 */
export const PreviewPublicQuoteLink: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const [publicQuote, setPublicQuote] = useState<PublicQuote | null>(null)
  const [quote, setQuote] = useState<any>(null)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)

      // Load public quote
      const quotes = await publicQuotesService.listAllPublicQuotes()
      const foundPublicQuote = quotes.find(q => q.id === id)

      if (!foundPublicQuote) {
        setError('Public quote not found')
        return
      }

      setPublicQuote(foundPublicQuote)

      // Load full quote data
      const quoteId = foundPublicQuote.quoteId
      const fullQuote = await quotesService.getQuote(quoteId)
      setQuote(fullQuote)

      // Load branding
      const brandingData = await brandingService.getBranding()
      setBranding(brandingData)
    } catch (err) {
      console.error('Failed to load preview data:', err)
      setError('Failed to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  const previewConfig = usePublicQuoteRenderer(
    publicQuote?.template ? {
      id: publicQuote.template.id,
      name: publicQuote.template.name,
      content: publicQuote.template.content,
      createdAt: '',
      updatedAt: '',
      isDefault: false,
      active: true
    } : null,
    quote,
    branding
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-500">{t('public_quotes.loading_preview')}</div>
      </div>
    )
  }

  if (error || !previewConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-red-600">{error || t('public_quotes.failed_to_load')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Render 
        config={previewConfig} 
        data={publicQuote?.template?.content || { root: {}, content: [], zones: {} }} 
      />
    </div>
  )
}

