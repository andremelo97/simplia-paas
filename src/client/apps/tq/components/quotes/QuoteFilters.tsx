import React from 'react'
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
  const statusOptions = [
    { value: 'all', label: 'All' },
    ...QUOTE_STATUS_OPTIONS
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
              label="Find your quote quickly"
              type="text"
              placeholder="Search by quote number or patient name"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <Select
              label="Status"
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