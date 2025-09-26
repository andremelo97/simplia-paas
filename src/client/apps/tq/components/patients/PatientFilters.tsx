import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface PatientFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange
}) => {
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-base">
          Search
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Input
          type="text"
          placeholder="Search patients by name or email"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}