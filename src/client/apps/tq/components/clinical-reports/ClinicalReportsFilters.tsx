import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface ClinicalReportsFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const ClinicalReportsFilters: React.FC<ClinicalReportsFiltersProps> = ({
  searchQuery,
  onSearchChange
}) => {
  const { t } = useTranslation('tq')

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          {t('clinical_reports.filters.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Input
          label={t('clinical_reports.filters.find_quickly')}
          type="text"
          placeholder={t('clinical_reports.filters.search_placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
