import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Render } from '@measured/puck'
import '@measured/puck/puck.css'
import { publicQuotesService } from '../../services/publicQuotes'
import { brandingService, BrandingData } from '../../services/branding'
import { createConfig } from './puck-config'

export const PreviewPublicQuoteTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<any>(null)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplateAndBranding()
  }, [id])

  // Set favicon from branding
  useEffect(() => {
    if (!branding?.logo) return

    // Create or update favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    link.href = branding.logo
  }, [branding])

  const loadTemplateAndBranding = async () => {
    if (!id) return

    try {
      setLoading(true)

      // Load branding
      const brandingData = await brandingService.getBranding()
      setBranding(brandingData)

      // Create config with branding
      const puckConfig = createConfig(brandingData)
      setConfig(puckConfig)

      // Load template
      const fetchedTemplate = await publicQuotesService.getTemplate(id)
      setTemplate(fetchedTemplate)
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setLoading(false)
    }
  }

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
    </div>
  )
}
