/**
 * LandingPageLinksSection
 *
 * Displays all generated landing page links for a specific document,
 * including active, revoked, and expired links.
 * Uses Card/CardHeader/CardContent to match the Landing Page card above.
 *
 * Intended to be embedded inside EditQuote / EditPrevention form sections.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, StatusBadge, Tooltip, Paginator, ConfirmDialog } from '@client/common/ui'
import {
  Copy,
  CheckCircle2,
  MessageCircle,
  Mail,
  Trash2,
  ExternalLink,
  Eye,
  Loader2
} from 'lucide-react'
import { landingPagesService, LandingPage } from '../../services/landingPages'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

import { cleanPhoneForWhatsApp } from '../../utils/phone'

interface LandingPageLinksSectionProps {
  documentId: string
  documentType: 'quote' | 'prevention'
  documentNumber: string
  patientName?: string
  patientEmail?: string
  patientPhone?: string
  patientPhoneCountryCode?: string
}

export const LandingPageLinksSection: React.FC<LandingPageLinksSectionProps> = ({
  documentId,
  documentType,
  documentNumber,
  patientName,
  patientEmail,
  patientPhone,
  patientPhoneCountryCode
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [links, setLinks] = useState<LandingPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailSentId, setEmailSentId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<LandingPage | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const ITEMS_PER_PAGE = 3

  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return links.slice(start, start + ITEMS_PER_PAGE)
  }, [links, currentPage])

  const loadLinks = useCallback(async () => {
    try {
      const data = await landingPagesService.getLandingPagesByDocument(documentId, documentType)
      setLinks(data || [])
    } catch (error) {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [documentId, documentType])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  // Expose reload for parent (e.g. after generating a new link)
  useEffect(() => {
    const handler = () => loadLinks()
    window.addEventListener('landing-page-created', handler)
    return () => window.removeEventListener('landing-page-created', handler)
  }, [loadLinks])

  const handleCopyLink = async (lp: LandingPage) => {
    const url = lp.publicUrl || `${window.location.origin}/lp/${lp.accessToken}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(lp.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const handleCopyPassword = async (lp: LandingPage) => {
    if (!lp.password) return
    try {
      await navigator.clipboard.writeText(lp.password)
      setCopiedPasswordId(lp.id)
      setTimeout(() => setCopiedPasswordId(null), 2000)
    } catch {}
  }

  const handleSendWhatsApp = (lp: LandingPage) => {
    if (!patientPhone) return

    const messageKey = documentType === 'quote'
      ? 'modals.generate_public_quote.whatsapp_message_quote'
      : 'modals.generate_public_quote.whatsapp_message_prevention'

    const link = lp.publicUrl || `${window.location.origin}/lp/${lp.accessToken}`
    const message = t(messageKey, {
      link,
      password: lp.password || ''
    })

    const phone = cleanPhoneForWhatsApp(patientPhone, patientPhoneCountryCode)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSendEmail = async (lp: LandingPage) => {
    setSendingEmailId(lp.id)
    try {
      await landingPagesService.sendEmail(lp.id)
      setEmailSentId(lp.id)
      setTimeout(() => setEmailSentId(null), 3000)
    } catch {
      // HTTP interceptor handles feedback
    } finally {
      setSendingEmailId(null)
    }
  }

  const handleRevokeClick = (lp: LandingPage) => {
    setRevokeTarget(lp)
    setShowRevokeDialog(true)
  }

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return
    setIsRevoking(true)
    try {
      await landingPagesService.revokeLandingPage(revokeTarget.id)
      await loadLinks()
    } catch {
      // HTTP interceptor handles feedback
    } finally {
      setIsRevoking(false)
      setShowRevokeDialog(false)
      setRevokeTarget(null)
    }
  }

  const getLinkStatus = (lp: LandingPage): 'active' | 'revoked' | 'expired' => {
    if (!lp.active) return 'revoked'
    if (lp.expiresAt && new Date(lp.expiresAt) < new Date()) return 'expired'
    return 'active'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('landing_pages.links.section.title')}
          </h2>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            {t('common.loading')}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (links.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('landing_pages.links.section.title')}
        </h2>
      </CardHeader>

      <CardContent className="space-y-3 px-6 pb-6">
        {paginatedLinks.map((lp) => {
          const url = lp.publicUrl || `${window.location.origin}/lp/${lp.accessToken}`
          const status = getLinkStatus(lp)
          const isDisabled = status !== 'active'

          return (
            <div
              key={lp.id}
              className={`border border-gray-200 rounded-lg p-3 text-sm space-y-2 ${isDisabled ? 'bg-gray-50 opacity-75' : 'bg-gray-50/50'}`}
            >
              {/* Row 1: Link + Password + Status + Views */}
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white border border-gray-200 rounded px-2 py-0.5 truncate flex-1 min-w-0">
                  {url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(lp)}
                  className="h-7 px-1.5 text-sm gap-1 flex-shrink-0"
                >
                  {copiedId === lp.id ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
                </Button>

                {lp.password && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-500 flex-shrink-0">{t('landing_pages.links.card.password')}:</span>
                    <code className="text-sm bg-white border border-gray-200 rounded px-2 py-0.5 font-mono flex-shrink-0">
                      {lp.password}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPassword(lp)}
                      className="h-7 px-1.5 text-sm gap-1 flex-shrink-0"
                    >
                      {copiedPasswordId === lp.id ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
                    </Button>
                  </>
                )}

                <span className="text-gray-400 flex-shrink-0">|</span>
                <StatusBadge status={status} />
                <span className="text-sm text-gray-500 flex-shrink-0">
                  <Eye size={14} className="inline mr-0.5" />{lp.viewsCount}
                </span>
              </div>

              {/* Row 2: Dates */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{t('landing_pages.links.card.created')}: {formatShortDate(lp.createdAt)}</span>
                {lp.expiresAt && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{t('landing_pages.links.card.expires')}: {formatShortDate(lp.expiresAt)}</span>
                  </>
                )}
              </div>

              {/* Row 3: Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tooltip
                  content={isDisabled ? t('landing_pages.links.card.generate_new_link') : t('modals.generate_public_quote.whatsapp_no_phone')}
                  disabled={!isDisabled && !!patientPhone}
                  side="bottom"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendWhatsApp(lp)}
                    className="h-7 text-sm gap-1 text-green-700 hover:bg-green-50"
                    disabled={isDisabled || !patientPhone}
                  >
                    <MessageCircle size={14} />
                    {t('landing_pages.links.card.send_whatsapp')}
                  </Button>
                </Tooltip>

                <Tooltip
                  content={isDisabled ? t('landing_pages.links.card.generate_new_link') : t('modals.generate_public_quote.email_no_email')}
                  disabled={!isDisabled && !!patientEmail}
                  side="bottom"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(lp)}
                    disabled={isDisabled || !patientEmail || sendingEmailId === lp.id || emailSentId === lp.id}
                    className="h-7 text-sm gap-1 text-purple-700 hover:bg-purple-50"
                  >
                    {sendingEmailId === lp.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : emailSentId === lp.id ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Mail size={14} />
                    )}
                    {sendingEmailId === lp.id
                      ? t('landing_pages.links.card.sending_email')
                      : emailSentId === lp.id
                        ? t('landing_pages.links.card.email_sent')
                        : t('landing_pages.links.card.send_email')
                    }
                  </Button>
                </Tooltip>

                <Tooltip content={t('landing_pages.links.card.generate_new_link')} disabled={!isDisabled} side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                    className="h-7 text-sm gap-1"
                    disabled={isDisabled}
                  >
                    <ExternalLink size={14} />
                    {t('landing_pages.links.card.open')}
                  </Button>
                </Tooltip>

                {canEdit && status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeClick(lp)}
                    className="h-7 text-sm gap-1 text-red-600 hover:bg-red-50 ml-auto"
                  >
                    <Trash2 size={14} />
                    {t('landing_pages.links.card.revoke')}
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        <Paginator
          currentPage={currentPage}
          totalItems={links.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </CardContent>

      <ConfirmDialog
        isOpen={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        onConfirm={handleRevokeConfirm}
        title={t('landing_pages.pages.revoke_link_title')}
        description={t('landing_pages.pages.revoke_link_description', { documentNumber })}
        confirmText={t('landing_pages.pages.revoke_link')}
        variant="delete"
        isLoading={isRevoking}
      />
    </Card>
  )
}
