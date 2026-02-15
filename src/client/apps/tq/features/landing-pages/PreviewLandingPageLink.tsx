import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Render } from '@measured/puck'
import { X } from 'lucide-react'
import { landingPagesService } from '../../services/landingPages'
import { createConfigWithResolvedData } from './puck-config-preview'
import '@measured/puck/puck.css'

interface PreviewData {
  content: {
    template: any
    resolvedData: any
  }
  branding: {
    primaryColor: string
    secondaryColor: string
    tertiaryColor: string
    logo: string | null
    socialLinks?: Record<string, string> | null
    email?: string | null
    phone?: string | null
    address?: string | null
    companyName?: string | null
  }
}

/**
 * Preview page for authenticated users to see what patients will see
 * Uses the stored content package (same as public access) - no password needed
 */
export const PreviewLandingPageLink: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PreviewData | null>(null)
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
    if (!id) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await landingPagesService.getLandingPagePreview(id)
        setData(result)
      } catch (err) {
        setError(t('landing_pages.failed_to_load'))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const quoteLabels = useMemo(() => ({
    quoteNumber: t('landing_pages.labels.quote_number'),
    total: t('landing_pages.labels.total'),
    noItems: t('landing_pages.labels.items_empty'),
    item: t('landing_pages.labels.item'),
    quantity: t('landing_pages.labels.quantity'),
    price: t('landing_pages.labels.price'),
    discount: t('landing_pages.labels.discount')
  }), [t])

  const footerLabels = useMemo(() => ({
    socialTitle: t('landing_pages.footer.social_title'),
    quickLinksTitle: t('landing_pages.footer.quick_links_title'),
    contactTitle: t('landing_pages.footer.contact_title')
  }), [t])

  const previewConfig = useMemo(() => {
    if (!data?.content || !data?.branding) return null

    const branding = {
      tenantId: 0,
      primaryColor: data.branding.primaryColor,
      secondaryColor: data.branding.secondaryColor,
      tertiaryColor: data.branding.tertiaryColor,
      logoUrl: data.branding.logo || null,
      companyName: data.branding.companyName || null,
      socialLinks: data.branding.socialLinks || null,
      email: data.branding.email || null,
      phone: data.branding.phone || null,
      address: data.branding.address || null
    }

    return createConfigWithResolvedData(branding, data.content.resolvedData, {
      labels: quoteLabels,
      footerLabels,
      onOpenWidget: handleOpenWidget
    })
  }, [data, quoteLabels, footerLabels, handleOpenWidget])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-500">{t('landing_pages.loading_preview')}</div>
      </div>
    )
  }

  if (error || !previewConfig || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-red-600">{error || t('landing_pages.failed_to_load')}</div>
      </div>
    )
  }

  // Check if template has content
  if (!data.content.template || !data.content.template.content || data.content.template.content.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('landing_pages.access.no_content_title')}</h1>
          <p className="text-gray-600">{t('landing_pages.access.no_content_description')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Render config={previewConfig} data={data.content.template} />

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
