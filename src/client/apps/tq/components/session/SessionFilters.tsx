import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle, Input, Select, Combobox, DateInput, Badge, Button } from '@client/common/ui'
import { getSessionStatusOptions, SessionStatus } from '../../types/sessionStatus'
import { usePatientOptions, useUserOptions } from '../../hooks/useFilterOptions'

interface SessionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: SessionStatus | 'all'
  onStatusFilterChange: (status: SessionStatus | 'all') => void
  patientId?: string
  onPatientChange: (patientId?: string) => void
  createdByUserId?: number
  onCreatedByChange: (userId?: number) => void
  createdFrom?: string
  onCreatedFromChange: (date?: string) => void
  createdTo?: string
  onCreatedToChange: (date?: string) => void
}

export const SessionFilters: React.FC<SessionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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

  const statusOptions = [
    { value: 'all', label: t('sessions.filters.all') },
    ...getSessionStatusOptions()
  ]

  const activeFilterCount = [
    searchQuery !== '',
    statusFilter !== 'all',
    patientId !== undefined,
    createdByUserId !== undefined,
    createdFrom !== undefined,
    createdTo !== undefined
  ].filter(Boolean).length

  const handleClearAll = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onPatientChange(undefined)
    onCreatedByChange(undefined)
    onCreatedFromChange(undefined)
    onCreatedToChange(undefined)
  }

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {t('sessions.filters.title')}
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge className="bg-[#B725B7] text-white text-xs px-1.5 py-0.5">
                {t('common:filters_active', { count: activeFilterCount })}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-gray-500 hover:text-gray-700 h-7 px-2 text-xs"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t('common:clear_filters')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="col-span-1">
            <Input
              label={t('sessions.filters.find_quickly')}
              type="text"
              placeholder={t('sessions.filters.search_placeholder')}
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
            <Select
              label={t('common.status')}
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as SessionStatus | 'all')}
              options={statusOptions}
              className="w-full"
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
