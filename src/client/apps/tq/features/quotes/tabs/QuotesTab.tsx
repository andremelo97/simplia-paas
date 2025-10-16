import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Paginator
} from '@client/common/ui'
import { useQuotesList } from '../../../hooks/useQuotes'
import { QuoteRow } from '../../../components/quotes/QuoteRow'
import { QuotesEmpty } from '../../../components/quotes/QuotesEmpty'
import { QuoteFilters } from '../../../components/quotes/QuoteFilters'
import { Quote } from '../../../services/quotes'
import { QuoteStatus } from '../../../types/quoteStatus'

export const QuotesTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const navigate = useNavigate()

  const {
    data: quotes,
    total,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    setQuery,
    setStatusFilter: setHookStatusFilter,
    refresh
  } = useQuotesList({
    query: searchQuery,
    statusFilter: statusFilter
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setQuery(query)
  }

  const handleStatusFilterChange = (status: QuoteStatus | 'all') => {
    setStatusFilter(status)
    setHookStatusFilter(status)
  }

  const handleEditQuote = (quote: Quote) => {
    navigate(`/quotes/${quote.id}/edit`)
  }

  const handleDeleteQuote = (quote: Quote) => {
    // Placeholder: Will be implemented later
    console.log('Delete quote:', quote)
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <QuoteFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Quote List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('quotes.pages.list_title')} ({quotes?.length || 0} {t('common.of')} {total} {t('quotes.pages.quotes')})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Error State */}
          {error && (
            <Alert className="mb-4">
              <AlertDescription>
                {error}{' '}
                <button
                  onClick={refresh}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  {t('common.try_again')}
                </button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (quotes?.length || 0) === 0 && (
            <QuotesEmpty
              hasQuery={!!searchQuery}
              query={searchQuery}
            />
          )}

          {/* Quote List */}
          {!loading && !error && (quotes?.length || 0) > 0 && (
            <>
              {/* Header Row */}
              <div className="flex items-center gap-6 py-2 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="w-24">{t('common.created')}</div>
                <div className="flex-1">{t('quotes.title')}</div>
                <div className="flex-1">{t('common.session')}</div>
                <div className="flex-1">{t('common.status')}</div>
                <div className="flex-1">{t('common.patient')}</div>
                <div className="w-24">{t('common.total')}</div>
                <div className="w-24"></div> {/* Space for actions */}
              </div>

              {/* Quote Rows */}
              <div className="divide-y divide-gray-100">
                {quotes.map((quote) => (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    onEdit={handleEditQuote}
                    onDelete={handleDeleteQuote}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Paginator
                currentPage={currentPage}
                totalItems={total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
