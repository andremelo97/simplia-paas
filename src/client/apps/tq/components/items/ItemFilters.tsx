import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input, Checkbox } from '@client/common/ui'

interface ItemFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  includeInactive: boolean
  onIncludeInactiveChange: (include: boolean) => void
}

export const ItemFilters: React.FC<ItemFiltersProps> = ({
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
          {t('quote_items.filters.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <Input
              label={t('quote_items.filters.find_quickly')}
              type="text"
              placeholder={t('quote_items.filters.search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1 flex items-center">
            <Checkbox
              label={t('quote_items.filters.include_inactive')}
              checked={includeInactive}
              onChange={(e) => onIncludeInactiveChange(e.target.checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}