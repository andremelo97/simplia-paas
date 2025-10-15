import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, CardTitle, Input, Select } from '@client/common/ui'
import { getSessionStatusOptions, SessionStatus } from '../../types/sessionStatus'

interface SessionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: SessionStatus | 'all'
  onStatusFilterChange: (status: SessionStatus | 'all') => void
}

export const SessionFilters: React.FC<SessionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const { t } = useTranslation('tq')

  const statusOptions = [
    { value: 'all', label: t('sessions.filters.all') },
    ...getSessionStatusOptions()
  ]

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          {t('sessions.filters.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
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
            <Select
              label={t('common.status')}
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as SessionStatus | 'all')}
              options={statusOptions}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}