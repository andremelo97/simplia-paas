import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input, Combobox, DateInput } from '@client/common/ui'
import { usePatientOptions, useUserOptions } from '../../hooks/useFilterOptions'

interface PreventionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  patientId?: string
  onPatientChange: (patientId?: string) => void
  createdByUserId?: number
  onCreatedByChange: (userId?: number) => void
  createdFrom?: string
  onCreatedFromChange: (date?: string) => void
  createdTo?: string
  onCreatedToChange: (date?: string) => void
}

export const PreventionFilters: React.FC<PreventionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  patientId,
  onPatientChange,
  createdByUserId,
  onCreatedByChange,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange
}) => {
  const { t } = useTranslation('tq')
  const patientOptions = usePatientOptions()
  const userOptions = useUserOptions()

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          {t('prevention.filters.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-1">
            <Input
              label={t('prevention.filters.find_quickly')}
              type="text"
              placeholder={t('prevention.filters.search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <Combobox
              label={t('common.patient')}
              value={patientId}
              options={patientOptions.options}
              onChange={onPatientChange}
              onSearch={patientOptions.search}
              loading={patientOptions.loading}
              placeholder={t('filters.select_patient')}
              searchPlaceholder={t('filters.type_to_search')}
              noOptionsText={t('filters.no_results')}
            />
          </div>

          <div className="col-span-1">
            <Combobox
              label={t('common.created_by')}
              value={createdByUserId?.toString()}
              options={userOptions.options}
              onChange={(val) => onCreatedByChange(val ? parseInt(val) : undefined)}
              onSearch={userOptions.search}
              loading={userOptions.loading}
              placeholder={t('filters.select_user')}
              searchPlaceholder={t('filters.type_to_search')}
              noOptionsText={t('filters.no_results')}
            />
          </div>

          <div className="col-span-1">
            <DateInput
              label={t('filters.created_from')}
              value={createdFrom || ''}
              onChange={(e) => onCreatedFromChange(e.target.value || undefined)}
            />
          </div>

          <div className="col-span-1">
            <DateInput
              label={t('filters.created_to')}
              value={createdTo || ''}
              onChange={(e) => onCreatedToChange(e.target.value || undefined)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
