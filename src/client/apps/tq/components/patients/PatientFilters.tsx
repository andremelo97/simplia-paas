import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle, Input, Badge } from '@client/common/ui'

interface PatientFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange
}) => {
  const { t } = useTranslation('tq')

  const activeFilterCount = searchQuery !== '' ? 1 : 0

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {t('common.search')}
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge className="bg-[#B725B7] text-white text-xs px-1.5 py-0.5">
                {t('common:filters_active', { count: activeFilterCount })}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => onSearchChange('')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('common:clear_filters')}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Input
          type="text"
          placeholder={t('patients.filters.search_placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
