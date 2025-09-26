import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input, Select } from '@client/common/ui'
import { SESSION_STATUS_OPTIONS, SessionStatus } from '../../types/sessionStatus'

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
  const statusOptions = [
    { value: 'all', label: 'All' },
    ...SESSION_STATUS_OPTIONS
  ]

  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
        Search and filters
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <Input
              label="Find your session quickly"
              type="text"
              placeholder="Search by session number or patient name"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <Select
              label="Status"
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