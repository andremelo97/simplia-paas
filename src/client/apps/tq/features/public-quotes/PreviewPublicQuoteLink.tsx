import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Puck, Render } from '@measured/puck'
import { X } from 'lucide-react'
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

  // Widget modal state
  const [widgetModal, setWidgetModal] = useState<{
    isOpen: boolean
    url: string
    title: string
    height: string
  }>({ isOpen: false, url: '', title: '', height: '600' })

  const handleOpenWidget = useCallback((config: { url: string; title: string; height: string }) => {
    setWidgetModal({
      isOpen: true,
      url: config.url,
      title: config.title,
      height: config.height
    })
  }, [])

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
    branding,
    { onOpenWidget: handleOpenWidget }
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

      {/* Widget modal with iframe */}
      {widgetModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setWidgetModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {widgetModal.title}
              </h2>
              <button
                onClick={() => setWidgetModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Iframe container */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={widgetModal.url}
                width="100%"
                height={widgetModal.height === '100vh' ? '100%' : `${widgetModal.height}px`}
                style={{
                  border: 'none',
                  minHeight: widgetModal.height === '100vh' ? 'calc(90vh - 60px)' : undefined
                }}
                title={widgetModal.title}
                allow="payment; clipboard-write"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

