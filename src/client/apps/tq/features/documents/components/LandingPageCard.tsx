import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Select } from '@client/common/ui'
import { landingPagesService, LandingPageTemplate } from '../../../services/landingPages'
import { DocumentConfig } from '../documentConfig'

interface LandingPageCardProps {
  documentId: string
  documentNumber: string
  config: DocumentConfig
  patientName?: string
  patientEmail?: string
  patientPhone?: string
  onShowGenerateModal?: () => void
}

export const LandingPageCard: React.FC<LandingPageCardProps> = ({
  documentId,
  documentNumber,
  config,
  patientName,
  patientEmail,
  patientPhone,
  onShowGenerateModal
}) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const response = await landingPagesService.listTemplates({ active: true })
        setTemplates(response.data)

        // Set default template if exists
        const defaultTemplate = response.data.find((t: LandingPageTemplate) => t.isDefault)
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id)
        }
      } catch (error) {
        // Failed to load templates
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [])

  const handlePreview = () => {
    if (config.previewPath && selectedTemplateId) {
      window.open(config.previewPath(documentId, selectedTemplateId), '_blank')
    }
  }

  const handleViewLandingPages = () => {
    if (documentNumber) {
      navigate(`/landing-pages/links?document=${encodeURIComponent(documentNumber)}&documentType=${config.type}`)
    }
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('landing_pages.title', 'Landing Page')}
        </h2>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        <Select
          label={t('quotes.template')}
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          options={[
            { value: '', label: t('quotes.select_template') },
            ...templates.map(t => ({ value: t.id, label: t.name }))
          ]}
          disabled={isLoadingTemplates}
          helperText={t('quotes.select_template_helper')}
        />

        {selectedTemplateId && (
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreview}
              disabled={!selectedTemplateId}
            >
              {t('quotes.preview_template')}
            </Button>

            {onShowGenerateModal && (
              <Button
                type="button"
                variant="primary"
                onClick={onShowGenerateModal}
              >
                {t('landing_pages.generate', 'Generate Landing Page')}
              </Button>
            )}

            <Button
              type="button"
              variant="tertiary"
              onClick={handleViewLandingPages}
            >
              {t('landing_pages.view_landing_pages', 'View Landing Pages')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
