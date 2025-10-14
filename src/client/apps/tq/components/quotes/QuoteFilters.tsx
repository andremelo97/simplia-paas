import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input, Select } from '@client/common/ui'
import { QUOTE_STATUS_OPTIONS, QuoteStatus } from '../../types/quoteStatus'

interface QuoteFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: QuoteStatus | 'all'
  onStatusFilterChange: (status: QuoteStatus | 'all') => void
}

export const QuoteFilters: React.FC<QuoteFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const { t } = useTranslation('tq')

  const statusOptions = [
    { value: 'all', label: t('quotes.filters.all') },
    ...QUOTE_STATUS_OPTIONS
  ]

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          {t('quotes.filters.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <Input
              label={t('quotes.filters.find_quickly')}
              type="text"
              placeholder={t('quotes.filters.search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <Select
              label={t('common.status')}
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as QuoteStatus | 'all')}
              options={statusOptions}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}