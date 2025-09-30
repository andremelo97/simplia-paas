import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface ClinicalReportsFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const ClinicalReportsFilters: React.FC<ClinicalReportsFiltersProps> = ({
  searchQuery,
  onSearchChange
}) => {
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          Search and filters
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Input
          label="Find your clinical report quickly"
          type="text"
          placeholder="Search by report number or patient name"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}
