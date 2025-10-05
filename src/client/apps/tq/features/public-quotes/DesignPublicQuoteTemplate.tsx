import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Puck } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button } from '@client/common/ui'
import { Maximize2, Minimize2, Eye, Save } from 'lucide-react'
import { publicQuotesService } from '../../services/publicQuotes'
import { brandingService, BrandingData } from '../../services/branding'
import { createConfig } from './puck-config'

export const DesignPublicQuoteTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<any>(null)
  const [data, setData] = useState<any>({ content: [], root: {} })
  const [isSaving, setIsSaving] = useState(false)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    loadBrandingAndTemplate()
  }, [id])

  const loadBrandingAndTemplate = async () => {
    try {
      // Load branding first
      const brandingData = await brandingService.getBranding()
      setBranding(brandingData)

      // Create config with branding
      const puckConfig = createConfig(brandingData)
      setConfig(puckConfig)

      // Then load template
      await loadTemplate()
    } catch (error) {
      console.error('Failed to load branding:', error)
    }
  }

  const loadTemplate = async () => {
    if (!id) return
    try {
      const fetchedTemplate = await publicQuotesService.getTemplate(id)
      setTemplate(fetchedTemplate)

      // Load existing content or initialize empty
      if (fetchedTemplate.content && Object.keys(fetchedTemplate.content).length > 0) {
        setData(fetchedTemplate.content)
      } else {
        setData({ content: [], root: {} })
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const handleSave = async () => {
    if (!id) return
    setIsSaving(true)
    try {
      const updatedTemplate = await publicQuotesService.updateTemplate(id, {
        content: data
      })
      console.log('✅ Template layout saved:', data)
      // Update template state to reflect saved changes
      setTemplate(updatedTemplate)
    } catch (error) {
      console.error('❌ Failed to save template layout:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/public-quotes/templates')
  }

  const handlePreview = () => {
    if (!id) return
    window.open(`/public-quotes/templates/${id}/preview`, '_blank')
  }

  const hasContent = data?.content && Array.isArray(data.content) && data.content.length > 0

  if (!template || !config || !branding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading template...</div>
      </div>
    )
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen flex flex-col'}>
      {/* Header */}
      {!isFullscreen && (
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Design Template Layout</h1>
            <p className="text-sm text-gray-600 mt-1">{template.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Puck Editor */}
      <div className={isFullscreen ? 'h-screen' : 'flex-1 overflow-hidden'}>
        <Puck
          config={config}
          data={data}
          onChange={(updatedData: any) => {
            setData(updatedData)
          }}
          onPublish={(publishedData: any) => {
            setData(publishedData)
          }}
          iframe={{
            enabled: true,
          }}
          overrides={{
            headerActions: () => (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Layout'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={!hasContent}
                  className="flex items-center gap-2"
                >
                  <Eye size={16} />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="flex items-center gap-2"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 size={16} />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 size={16} />
                      Fullscreen
                    </>
                  )}
                </Button>
              </div>
            ),
          }}
        />
      </div>
    </div>
  )
}
