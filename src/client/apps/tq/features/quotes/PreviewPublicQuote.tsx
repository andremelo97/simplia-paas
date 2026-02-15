import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button } from '@client/common/ui'
import { X } from 'lucide-react'
import { landingPagesService, LandingPageTemplate } from '../../services/landingPages'
import { quotesService } from '../../services/quotes'
import { preventionService } from '../../services/prevention'
import { brandingService, BrandingData } from '../../services/branding'
import { usePublicQuoteRenderer } from '../../hooks/usePublicQuoteRenderer'

export const PreviewPublicQuote: React.FC = () => {
  const { id: documentId, templateId, documentType } = useParams<{ id: string; templateId: string; documentType: string }>()
  const navigate = useNavigate()

  const [document, setDocument] = useState<any | null>(null)
  const [template, setTemplate] = useState<LandingPageTemplate | null>(null)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    loadData()
  }, [documentId, templateId, documentType])

  const loadData = async () => {
    if (!documentId || !templateId) return

    try {
      setIsLoading(true)

      // Load document based on type
      const fetchDocument = documentType === 'prevention'
        ? preventionService.getById(documentId)
        : quotesService.getQuote(documentId)

      // Load all data in parallel
      const [fetchedDocument, templateData, brandingData] = await Promise.all([
        fetchDocument,
        landingPagesService.getTemplate(templateId),
        brandingService.getBranding()
      ])

      setDocument(fetchedDocument)
      setTemplate(templateData)
      setBranding(brandingData)

    } catch (error) {
      // Failed to load preview data
    } finally {
      setIsLoading(false)
    }
  }

  // Create config with resolved document data using reusable hook
  const previewConfig = usePublicQuoteRenderer(template, document, branding, {
    onOpenWidget: handleOpenWidget
  })

  const handleBack = () => {
    const docType = documentType || 'quote'
    navigate(`/documents/${docType}/${documentId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading preview...</div>
      </div>
    )
  }

  if (!document || !template || !previewConfig || !branding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load preview</p>
          <Button variant="secondary" onClick={handleBack}>
            Back to Document
          </Button>
        </div>
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
      <Render config={previewConfig} data={template.content} />

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
