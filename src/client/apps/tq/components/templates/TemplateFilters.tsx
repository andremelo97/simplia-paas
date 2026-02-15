import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input, Checkbox } from '@client/common/ui'

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

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          {t('templates.filters.title')}
        </CardTitle>
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