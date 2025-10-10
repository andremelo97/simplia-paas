import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Paginator
} from '@client/common/ui'
import { useTemplatesList } from '../../hooks/useTemplates'
import { TemplateRow } from '../../components/templates/TemplateRow'
import { TemplatesEmpty } from '../../components/templates/TemplatesEmpty'
import { TemplateFilters } from '../../components/templates/TemplateFilters'
import { Template } from '../../services/templates'

export const Templates: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const navigate = useNavigate()

  const {
    data: templates,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setSearch,
    setActive,
    refetch
  } = useTemplatesList({
    pageSize: 10
  })

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setSearch(search)
  }

  const handleIncludeInactiveChange = (include: boolean) => {
    setIncludeInactive(include)
    // If including inactive, show all (undefined), otherwise show only active (true)
    setActive(include ? undefined : true)
  }

  const handleEditTemplate = (template: Template) => {
    navigate(`/templates/${template.id}/edit`)
  }

  const handleDeleteTemplate = () => {
    refetch()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('templates.pages.management_title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('templates.pages.management_subtitle')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/templates/create')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('templates.pages.add_template')}
        </Button>
      </div>

      {/* Filters */}
      <TemplateFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        includeInactive={includeInactive}
        onIncludeInactiveChange={handleIncludeInactiveChange}
      />

      {/* Content */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('templates.pages.list_title')} ({templates?.length || 0} {t('common.of')} {total} {t('templates.pages.templates')})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Error State */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription>
                {error}{' '}
                <button
                  onClick={refetch}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  {t('common.try_again')}
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <TemplatesEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          ) : (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-2 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('common.title')}</div>
                <div className="flex-1">{t('common.description')}</div>
                <div className="w-20">{t('common.usage')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Template Rows */}
              <div className="divide-y divide-gray-100">
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Paginator
                currentPage={currentPage}
                totalItems={total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

    </div>
  )
}