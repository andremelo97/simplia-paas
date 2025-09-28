import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input, Select } from '@client/common/ui'

interface TemplateFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
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
              label="Find your template quickly"
              type="text"
              placeholder="Search templates by title or description"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
              options={statusOptions}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}