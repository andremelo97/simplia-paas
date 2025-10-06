import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Input } from '@client/common/ui'

interface PublicQuoteLinksFiltersProps {
  quoteFilter: string
  onQuoteFilterChange: (value: string) => void
}

export const PublicQuoteLinksFilters: React.FC<PublicQuoteLinksFiltersProps> = ({
  quoteFilter,
  onQuoteFilterChange
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
          label="Filter by Quote"
          type="text"
          placeholder="Quote number"
          value={quoteFilter}
          onChange={(e) => onQuoteFilterChange(e.target.value)}
        />
      </CardContent>
    </Card>
  )
}
