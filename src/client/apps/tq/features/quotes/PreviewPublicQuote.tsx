import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button } from '@client/common/ui'
import { ArrowLeft } from 'lucide-react'
import { publicQuotesService, PublicQuoteTemplate } from '../../services/publicQuotes'
import { quotesService, Quote } from '../../services/quotes'
import { brandingService, BrandingData } from '../../services/branding'
import { createConfig } from '../public-quotes/puck-config'
import { createConfigWithResolvedData } from '../public-quotes/puck-config-preview'
import { resolveTemplateVariables } from '../../lib/resolveTemplateVariables'

export const PreviewPublicQuote: React.FC = () => {
  const { id: quoteId, templateId } = useParams<{ id: string; templateId: string }>()
  const navigate = useNavigate()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [template, setTemplate] = useState<PublicQuoteTemplate | null>(null)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [quoteId, templateId])

  const loadData = async () => {
    if (!quoteId || !templateId) return

    try {
      setIsLoading(true)

      // Load all data in parallel
      const [fetchedQuote, templateData, brandingData] = await Promise.all([
        quotesService.getQuote(quoteId),
        publicQuotesService.getTemplate(templateId),
        brandingService.getBranding()
      ])

      setQuote(fetchedQuote)
      setTemplate(templateData)
      setBranding(brandingData)

    } catch (error) {
      console.error('Failed to load preview data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create config with resolved quote data
  const previewConfig = useMemo(() => {
    if (!branding || !quote) return null

    const resolvedData = resolveTemplateVariables(template?.content || {}, quote)
    return createConfigWithResolvedData(branding, resolvedData)
  }, [branding, quote, template])

  const handleBack = () => {
    navigate(`/quotes/${quoteId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading preview...</div>
      </div>
    )
  }

  if (!quote || !template || !previewConfig || !branding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load preview</p>
          <Button variant="secondary" onClick={handleBack}>
            Back to Quote
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
    </div>
  )
}
