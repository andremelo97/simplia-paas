import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface TemplateFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
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
          placeholder="Search templates by title or description"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </CardContent>
    </Card>
  )
}