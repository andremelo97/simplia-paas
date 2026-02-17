import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tooltip, Paginator } from '@client/common/ui'
import { Plus } from 'lucide-react'
import { landingPagesService, LandingPageTemplate } from '../../../services/landingPages'
import { brandingService, BrandingData } from '../../../services/branding'
import { TemplatesEmpty } from '../../../components/landing-pages/TemplatesEmpty'
import { TemplateCard } from '../../../components/landing-pages/TemplateCard'
import { useAuthStore } from '../../../shared/store'

const MAX_TOTAL_TEMPLATES = 10
const MAX_ACTIVE_TEMPLATES = 5
const TEMPLATES_PER_PAGE = 6

export const TemplatesTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const totalCount = templates?.length || 0
  const activeCount = templates?.filter(t => t.active).length || 0

  // Pagination
  const startIndex = (currentPage - 1) * TEMPLATES_PER_PAGE
  const paginatedTemplates = templates?.slice(startIndex, startIndex + TEMPLATES_PER_PAGE) || []
  const isMaxTotalReached = totalCount >= MAX_TOTAL_TEMPLATES
  const isMaxActiveReached = activeCount >= MAX_ACTIVE_TEMPLATES
  const isCreateDisabled = isMaxTotalReached

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [templatesResponse, brandingData] = await Promise.all([
        landingPagesService.listTemplates(),
        brandingService.getBranding(),
      ])
      setTemplates(templatesResponse.data || templatesResponse)
      setBranding(brandingData)
    } catch (error) {
      // Failed to load data
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateClick = (template: LandingPageTemplate) => {
    navigate(`/landing-pages/templates/${template.id}/edit`)
  }

  const getCreateDisabledReason = () => {
    if (isMaxTotalReached) return t('landing_pages.pages.max_total_reached')
    return ''
  }

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">
              {t('landing_pages.pages.templates_list')}
            </CardTitle>
            <Badge variant="secondary">
              {t('landing_pages.pages.templates_count', { count: totalCount, max: MAX_TOTAL_TEMPLATES })}
            </Badge>
            <Badge variant={isMaxActiveReached ? 'warning' : 'success'}>
              {t('landing_pages.pages.active_count', { count: activeCount, max: MAX_ACTIVE_TEMPLATES })}
            </Badge>
          </div>
          {canEdit && (
            <Tooltip content={getCreateDisabledReason()} disabled={!isCreateDisabled}>
              <Button
                variant="primary"
                disabled={isCreateDisabled}
                onClick={() => navigate('/landing-pages/templates/create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('landing_pages.pages.create_template')}
              </Button>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">{t('landing_pages.pages.loading_templates')}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!templates || templates.length === 0) && <TemplatesEmpty />}

        {/* Templates Grid - 3 columns */}
        {!loading && templates && templates.length > 0 && branding && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  branding={branding}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalCount > TEMPLATES_PER_PAGE && (
              <Paginator
                currentPage={currentPage}
                totalItems={totalCount}
                itemsPerPage={TEMPLATES_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
