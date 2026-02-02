import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { X } from 'lucide-react'
import { publicQuotesService } from '../../services/publicQuotes'
import { brandingService, BrandingData } from '../../services/branding'
import { createConfigWithResolvedData } from './puck-config-preview'

export const PreviewPublicQuoteTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<any>(null)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [loading, setLoading] = useState(true)

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
    loadTemplateAndBranding()
  }, [id])

  // Set favicon from branding
  useEffect(() => {
    if (!branding?.logoUrl) return

    // Create or update favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    link.href = branding.logoUrl
  }, [branding])

  const loadTemplateAndBranding = async () => {
    if (!id) return

    try {
      setLoading(true)

      // Load branding and template in parallel
      const [brandingData, fetchedTemplate] = await Promise.all([
        brandingService.getBranding(),
        publicQuotesService.getTemplate(id)
      ])

      setBranding(brandingData)
      setTemplate(fetchedTemplate)
    } catch (error) {
      // Failed to load template
    } finally {
      setLoading(false)
    }
  }

  // Create config with widget handler
  const config = branding ? createConfigWithResolvedData(branding, {}, {
    onOpenWidget: handleOpenWidget
  }) : null

  if (loading || !template || !config || !branding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('public_quotes.loading_preview')}</div>
      </div>
    )
  }

  if (!template.content || !template.content.content || template.content.content.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Content</h1>
          <p className="text-gray-600">This template doesn't have any content yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Render config={config} data={template.content} />

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
