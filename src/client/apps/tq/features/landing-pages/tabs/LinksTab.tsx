import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, LinkToast, ConfirmDialog } from '@client/common/ui'
import { LinksEmpty } from '../../../components/landing-pages/LinksEmpty'
import { LandingPageLinksFilters } from '../../../components/landing-pages/LandingPageLinksFilters'
import { LandingPageLinkRow } from '../../../components/landing-pages/LandingPageLinkRow'
import { landingPagesService, LandingPage } from '../../../services/landingPages'
import { useDateFilterParams } from '@client/common/utils/dateFilters'

export const LinksTab: React.FC = () => {
  const { t } = useTranslation('tq')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { convertDateRange } = useDateFilterParams()
  const [documentFilter, setDocumentFilter] = useState(searchParams.get('document') || '')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [showInactiveOnly, setShowInactiveOnly] = useState(false)
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [passwordLoadingId, setPasswordLoadingId] = useState<string | null>(null)

  // LinkToast state for new password
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{landingPageId: string, publicUrl: string, password: string, documentNumber: string} | null>(null)

  // ConfirmDialog state for revoke
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<{id: string, documentNumber: string} | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    loadLandingPages()
  }, [showActiveOnly, showInactiveOnly, createdFrom, createdTo, documentTypeFilter, convertDateRange])

  // Update filter when URL params change
  useEffect(() => {
    const documentParam = searchParams.get('document')
    if (documentParam) {
      setDocumentFilter(documentParam)
    }
  }, [searchParams])

  const loadLandingPages = async () => {
    try {
      setIsLoading(true)

      // Build filters object
      const filters: {
        active?: boolean
        document_type?: 'quote' | 'prevention'
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

      // Handle document type filter
      if (documentTypeFilter !== 'all') {
        filters.document_type = documentTypeFilter as 'quote' | 'prevention'
      }

      // Convert local dates to UTC timestamps using tenant timezone
      const dateParams = convertDateRange(createdFrom || undefined, createdTo || undefined)

      if (dateParams.created_from_utc) {
        filters.created_from = dateParams.created_from_utc
      }

      if (dateParams.created_to_utc) {
        filters.created_to = dateParams.created_to_utc
      }

      const pages = await landingPagesService.listAllLandingPages(filters)
      setLandingPages(pages)
    } catch (error) {
      // Failed to load landing pages
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeClick = (landingPage: LandingPage) => {
    const docNumber = landingPage.quote?.number || landingPage.prevention?.number || 'N/A'
    setRevokeTarget({
      id: landingPage.id,
      documentNumber: docNumber
    })
    setShowRevokeDialog(true)
  }

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return

    setIsRevoking(true)
    try {
      await landingPagesService.revokeLandingPage(revokeTarget.id)
      // Feedback is handled automatically by HTTP interceptor
      // Reload list
      await loadLandingPages()
    } catch (error) {
      // Error feedback is handled by HTTP interceptor
    } finally {
      setIsRevoking(false)
      setShowRevokeDialog(false)
      setRevokeTarget(null)
    }
  }

  const handleNewPassword = async (landingPage: LandingPage) => {
    setPasswordLoadingId(landingPage.id)
    try {
      const result = await landingPagesService.generateNewPassword(landingPage.id)
      const docNumber = landingPage.quote?.number || landingPage.prevention?.number || 'N/A'

      // Show LinkToast with new password
      setToastData({
        landingPageId: landingPage.id,
        publicUrl: result.publicUrl,
        password: result.password,
        documentNumber: docNumber
      })
      setShowLinkToast(true)
    } catch (error) {
      // Failed to generate new password
    } finally {
      setPasswordLoadingId(null)
    }
  }

  const handleClearFilters = () => {
    setDocumentFilter('')
    setDocumentTypeFilter('all')
    setShowActiveOnly(false)
    setShowInactiveOnly(false)
    setCreatedFrom('')
    setCreatedTo('')
    // Clear URL parameters
    navigate('/landing-pages/links', { replace: true })
  }

  const filteredPages = landingPages.filter(lp => {
    // Filter by document number (quote or prevention)
    if (documentFilter) {
      const quoteNumber = lp.quote?.number?.toLowerCase() || ''
      const preventionNumber = lp.prevention?.number?.toLowerCase() || ''
      const filter = documentFilter.toLowerCase()
      if (!quoteNumber.includes(filter) && !preventionNumber.includes(filter)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-8">
      {/* Filters */}
      <LandingPageLinksFilters
        documentFilter={documentFilter}
        onDocumentFilterChange={setDocumentFilter}
        documentTypeFilter={documentTypeFilter}
        onDocumentTypeFilterChange={setDocumentTypeFilter}
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
            {t('landing_pages.pages.links')} ({filteredPages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : filteredPages.length === 0 ? (
            <LinksEmpty />
          ) : (
            <div className="space-y-4">
              {filteredPages.map(landingPage => (
                <LandingPageLinkRow
                  key={landingPage.id}
                  landingPage={landingPage}
                  onRevoke={() => handleRevokeClick(landingPage)}
                  onNewPassword={() => handleNewPassword(landingPage)}
                  isNewPasswordLoading={passwordLoadingId === landingPage.id}
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
          itemNumber={toastData.documentNumber}
          itemId={toastData.landingPageId}
          onClose={() => setShowLinkToast(false)}
          type="landing-page"
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
        title={t('landing_pages.pages.revoke_link_title')}
        description={t('landing_pages.pages.revoke_link_description', { documentNumber: revokeTarget?.documentNumber })}
        confirmText={t('landing_pages.pages.revoke_link')}
        variant="delete"
        isLoading={isRevoking}
      />
    </div>
  )
}
