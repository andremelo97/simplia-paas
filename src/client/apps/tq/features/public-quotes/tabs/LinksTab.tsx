import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, LinkToast, ConfirmDialog } from '@client/common/ui'
import { LinksEmpty } from '../../../components/public-quotes/LinksEmpty'
import { PublicQuoteLinksFilters } from '../../../components/public-quotes/PublicQuoteLinksFilters'
import { PublicQuoteLinkRow } from '../../../components/public-quotes/PublicQuoteLinkRow'
import { publicQuotesService, PublicQuote } from '../../../services/publicQuotes'
import { useDateFilterParams } from '@client/common/utils/dateFilters'

export const LinksTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { convertDateRange } = useDateFilterParams()
  const [quoteFilter, setQuoteFilter] = useState(searchParams.get('quote') || '')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [showInactiveOnly, setShowInactiveOnly] = useState(false)
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [publicQuotes, setPublicQuotes] = useState<PublicQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [passwordLoadingId, setPasswordLoadingId] = useState<string | null>(null)

  // LinkToast state for new password
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{publicQuoteId: string, publicUrl: string, password: string, quoteNumber: string} | null>(null)

  // ConfirmDialog state for revoke
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<{id: string, quoteNumber: string} | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    loadPublicQuotes()
  }, [showActiveOnly, showInactiveOnly, createdFrom, createdTo, convertDateRange])

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
      
      // Build filters object
      const filters: {
        active?: boolean
        created_from?: string
        created_to?: string
      } = {}

      // Handle active/inactive filters
      if (showActiveOnly && !showInactiveOnly) {
        filters.active = true
      } else if (showInactiveOnly && !showActiveOnly) {
        filters.active = false
      }
      // If both or neither are checked, don't filter by active status

      // Convert local dates to UTC timestamps using tenant timezone
      const dateParams = convertDateRange(createdFrom || undefined, createdTo || undefined)

      if (dateParams.created_from_utc) {
        filters.created_from = dateParams.created_from_utc
      }

      if (dateParams.created_to_utc) {
        filters.created_to = dateParams.created_to_utc
      }

      const quotes = await publicQuotesService.listAllPublicQuotes(filters)
      setPublicQuotes(quotes)
    } catch (error) {
      // Failed to load public quotes
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeClick = (publicQuote: PublicQuote) => {
    setRevokeTarget({
      id: publicQuote.id,
      quoteNumber: publicQuote.quote?.number || 'N/A'
    })
    setShowRevokeDialog(true)
  }

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return

    setIsRevoking(true)
    try {
      await publicQuotesService.revokePublicQuote(revokeTarget.id)
      // Feedback is handled automatically by HTTP interceptor
      // Reload list
      await loadPublicQuotes()
    } catch (error) {
      // Error feedback is handled by HTTP interceptor
    } finally {
      setIsRevoking(false)
      setShowRevokeDialog(false)
      setRevokeTarget(null)
    }
  }

  const handleNewPassword = async (publicQuote: PublicQuote) => {
    setPasswordLoadingId(publicQuote.id)
    try {
      const result = await publicQuotesService.generateNewPassword(publicQuote.id)
      
      // Show LinkToast with new password
      setToastData({
        publicQuoteId: publicQuote.id,
        publicUrl: result.publicUrl,
        password: result.password,
        quoteNumber: publicQuote.quote?.number || 'N/A'
      })
      setShowLinkToast(true)
    } catch (error) {
      // Failed to generate new password
    } finally {
      setPasswordLoadingId(null)
    }
  }

  const handleClearFilters = () => {
    setQuoteFilter('')
    setShowActiveOnly(false)
    setShowInactiveOnly(false)
    setCreatedFrom('')
    setCreatedTo('')
    // Clear URL parameters
    navigate('/public-quotes/links', { replace: true })
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
        showActiveOnly={showActiveOnly}
        onShowActiveOnlyChange={setShowActiveOnly}
        showInactiveOnly={showInactiveOnly}
        onShowInactiveOnlyChange={setShowInactiveOnly}
        createdFrom={createdFrom}
        onCreatedFromChange={setCreatedFrom}
        createdTo={createdTo}
        onCreatedToChange={setCreatedTo}
        onClearFilters={handleClearFilters}
      />

      {/* Links List */}
      <Card>
        <CardHeader className="py-4 px-6">
          <CardTitle className="text-base">
            {t('public_quotes.pages.public_quote_links')} ({filteredQuotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : filteredQuotes.length === 0 ? (
            <LinksEmpty />
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map(publicQuote => (
                <PublicQuoteLinkRow
                  key={publicQuote.id}
                  publicQuote={publicQuote}
                  onRevoke={() => handleRevokeClick(publicQuote)}
                  onNewPassword={() => handleNewPassword(publicQuote)}
                  isNewPasswordLoading={passwordLoadingId === publicQuote.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Toast for New Password */}
      {toastData && (
        <LinkToast
          show={showLinkToast}
          itemNumber={toastData.quoteNumber}
          itemId={toastData.publicQuoteId}
          onClose={() => setShowLinkToast(false)}
          type="public-quote"
          publicUrl={toastData.publicUrl}
          password={toastData.password}
          duration={15000}
          darkBackground={true}
        />
      )}

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        onConfirm={handleRevokeConfirm}
        title={t('public_quotes.pages.revoke_link_title')}
        description={t('public_quotes.pages.revoke_link_description', { quoteNumber: revokeTarget?.quoteNumber })}
        confirmText={t('public_quotes.pages.revoke_link')}
        variant="delete"
        isLoading={isRevoking}
      />
    </div>
  )
}
