import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@client/common/ui'
import { Plus } from 'lucide-react'
import { publicQuotesService, PublicQuoteTemplate } from '../../../services/publicQuotes'
import { brandingService, BrandingData } from '../../../services/branding'
import { TemplatesEmpty } from '../../../components/public-quotes/TemplatesEmpty'
import { TemplateCard } from '../../../components/public-quotes/TemplateCard'
import { useAuthStore } from '../../../shared/store'

export const TemplatesTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [templates, setTemplates] = useState<PublicQuoteTemplate[]>([])
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [templatesResponse, brandingData] = await Promise.all([
        publicQuotesService.listTemplates(),
        brandingService.getBranding(),
      ])
      setTemplates(templatesResponse.data || templatesResponse)
      setBranding(brandingData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateClick = (template: PublicQuoteTemplate) => {
    navigate(`/public-quotes/templates/${template.id}/edit`)
  }

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t('public_quotes.pages.templates_list')} ({templates?.length || 0} {t('common.of')} 3)
          </CardTitle>
          {canEdit && (
            <Button
              variant="primary"
              disabled={(templates?.length || 0) >= 3}
              onClick={() => navigate('/public-quotes/templates/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('public_quotes.pages.create_template')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">{t('public_quotes.pages.loading_templates')}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!templates || templates.length === 0) && <TemplatesEmpty />}

        {/* Templates Grid - 3 columns */}
        {!loading && templates && templates.length > 0 && branding && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                branding={branding}
                onClick={() => handleTemplateClick(template)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
