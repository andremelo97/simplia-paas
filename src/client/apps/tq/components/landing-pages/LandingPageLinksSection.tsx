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
import { Card, CardHeader, CardContent, Button, StatusBadge, Tooltip, Paginator } from '@client/common/ui'
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

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

interface LandingPageLinksSectionProps {
  documentId: string
  documentType: 'quote' | 'prevention'
  documentNumber: string
  patientName?: string
  patientEmail?: string
  patientPhone?: string
}

export const LandingPageLinksSection: React.FC<LandingPageLinksSectionProps> = ({
  documentId,
  documentType,
  documentNumber,
  patientName,
  patientEmail,
  patientPhone
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

    const phone = cleanPhoneForWhatsApp(patientPhone)
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

  const handleRevoke = async (lp: LandingPage) => {
    try {
      await landingPagesService.revokeLandingPage(lp.id)
      await loadLinks()
    } catch {
      // HTTP interceptor handles feedback
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
              {/* Row 1: URL + Status + Views */}
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 truncate max-w-[280px] flex-1">
                  {url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(lp)}
                  className="h-6 px-1.5 text-xs gap-1"
                >
                  {copiedId === lp.id ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} />}
                </Button>

                {lp.password && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-xs text-gray-500">{t('landing_pages.links.card.password')}:</span>
                    <code className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 font-mono">
                      {lp.password}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPassword(lp)}
                      className="h-6 px-1.5 text-xs gap-1"
                    >
                      {copiedPasswordId === lp.id ? <CheckCircle2 size={12} className="text-green-600" /> : <Copy size={12} />}
                    </Button>
                  </>
                )}

                <span className="text-gray-400">|</span>
                <StatusBadge status={status} />
                <span className="text-xs text-gray-500">
                  <Eye size={12} className="inline mr-0.5" />{lp.viewsCount}
                </span>
                {lp.expiresAt && (
                  <span className="text-xs text-gray-500">
                    {formatShortDate(lp.expiresAt)}
                  </span>
                )}
              </div>

              {/* Row 2: Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {patientPhone && (
                  <Tooltip content={t('landing_pages.links.card.generate_new_link')} disabled={!isDisabled} side="bottom">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendWhatsApp(lp)}
                      className="h-7 text-xs gap-1 text-green-700 hover:bg-green-50"
                      disabled={isDisabled}
                    >
                      <MessageCircle size={13} />
                      {t('landing_pages.links.card.send_whatsapp')}
                    </Button>
                  </Tooltip>
                )}

                {patientEmail && (
                  <Tooltip content={t('landing_pages.links.card.generate_new_link')} disabled={!isDisabled} side="bottom">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendEmail(lp)}
                      disabled={sendingEmailId === lp.id || emailSentId === lp.id || isDisabled}
                      className="h-7 text-xs gap-1 text-purple-700 hover:bg-purple-50"
                    >
                      {sendingEmailId === lp.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : emailSentId === lp.id ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Mail size={13} />
                      )}
                      {sendingEmailId === lp.id
                        ? t('landing_pages.links.card.sending_email')
                        : emailSentId === lp.id
                          ? t('landing_pages.links.card.email_sent')
                          : t('landing_pages.links.card.send_email')
                      }
                    </Button>
                  </Tooltip>
                )}

                <Tooltip content={t('landing_pages.links.card.generate_new_link')} disabled={!isDisabled} side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                    className="h-7 text-xs gap-1"
                    disabled={isDisabled}
                  >
                    <ExternalLink size={13} />
                    {t('landing_pages.links.card.open')}
                  </Button>
                </Tooltip>

                {canEdit && status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(lp)}
                    className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50 ml-auto"
                  >
                    <Trash2 size={13} />
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
    </Card>
  )
}
