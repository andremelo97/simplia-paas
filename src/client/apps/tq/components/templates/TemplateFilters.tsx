import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle, Input, Checkbox, Badge } from '@client/common/ui'

interface TemplateFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  includeInactive: boolean
  onIncludeInactiveChange: (include: boolean) => void
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  searchQuery,
  onSearchChange,
  includeInactive,
  onIncludeInactiveChange
}) => {
  const { t } = useTranslation('tq')

  const activeFilterCount = [
    searchQuery !== '',
    includeInactive
  ].filter(Boolean).length

  const handleClearAll = () => {
    onSearchChange('')
    onIncludeInactiveChange(false)
  }

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {t('templates.filters.title')}
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge className="bg-[#B725B7] text-white text-xs px-1.5 py-0.5">
                {t('common:filters_active', { count: activeFilterCount })}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('common:clear_filters')}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <Input
              label={t('templates.filters.find_quickly')}
              type="text"
              placeholder={t('templates.filters.search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1 flex items-center">
            <Checkbox
              label={t('templates.filters.include_inactive')}
              checked={includeInactive}
              onChange={(e) => onIncludeInactiveChange(e.target.checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
