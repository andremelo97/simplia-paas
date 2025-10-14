import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface PatientFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange
}) => {
  const { t } = useTranslation('tq')

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          {t('common.search')}
        </CardTitle>
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