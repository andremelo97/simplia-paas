import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@client/common/ui'
import { LinksEmpty } from '../../../components/public-quotes/LinksEmpty'
import { PublicQuoteLinksFilters } from '../../../components/public-quotes/PublicQuoteLinksFilters'
import { PublicQuoteLinkRow } from '../../../components/public-quotes/PublicQuoteLinkRow'
import { publicQuotesService, PublicQuote } from '../../../services/publicQuotes'

export const LinksTab: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [quoteFilter, setQuoteFilter] = useState(searchParams.get('quote') || '')
  const [publicQuotes, setPublicQuotes] = useState<PublicQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPublicQuotes()
  }, [])

  // Update filter when URL params change
  useEffect(() => {
    const quoteParam = searchParams.get('quote')
    if (quoteParam) {
      setQuoteFilter(quoteParam)
    }
  }, [searchParams])

  const loadPublicQuotes = async () => {
    try {
      setIsLoading(true)
      const quotes = await publicQuotesService.listAllPublicQuotes()
      setPublicQuotes(quotes)
    } catch (error) {
      console.error('Failed to load public quotes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await publicQuotesService.revokePublicQuote(id)
      // Reload list
      await loadPublicQuotes()
    } catch (error) {
      console.error('Failed to revoke public quote:', error)
    }
  }

  const filteredQuotes = publicQuotes.filter(pq => {
    // Filter by quote number
    if (quoteFilter) {
      const quoteNumber = pq.quote?.number?.toLowerCase() || ''
      if (!quoteNumber.includes(quoteFilter.toLowerCase())) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-8">
      {/* Filters */}
      <PublicQuoteLinksFilters
        quoteFilter={quoteFilter}
        onQuoteFilterChange={setQuoteFilter}
      />

      {/* Links List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            Public Quote Links ({filteredQuotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredQuotes.length === 0 ? (
            <LinksEmpty />
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map(publicQuote => (
                <PublicQuoteLinkRow
                  key={publicQuote.id}
                  publicQuote={publicQuote}
                  onRevoke={() => handleRevoke(publicQuote.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
