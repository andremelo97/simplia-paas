import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@client/common/ui'
import { LinksEmpty } from '../../../components/public-quotes/LinksEmpty'
import { PublicQuoteLinksFilters } from '../../../components/public-quotes/PublicQuoteLinksFilters'

export const LinksTab: React.FC = () => {
  const [quoteFilter, setQuoteFilter] = useState('')

  const handleQuoteFilterChange = (value: string) => {
    setQuoteFilter(value)
    // TODO: Implement filter logic when integrating with API
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <PublicQuoteLinksFilters
        quoteFilter={quoteFilter}
        onQuoteFilterChange={handleQuoteFilterChange}
      />

      {/* Links List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            Public Quote Links (0)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <LinksEmpty />
        </CardContent>
      </Card>
    </div>
  )
}
