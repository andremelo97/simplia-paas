/**
 * LandingPageLinksSection
 *
 * Compact inline list of generated landing page links for a specific document.
 * Shows URL (copyable), password (decrypted), status, views, and action buttons
 * (Send Email, Send WhatsApp, Revoke).
 *
 * Intended to be embedded inside EditQuote / EditPrevention form sections.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, StatusBadge } from '@client/common/ui'
import {
  Copy,
  CheckCircle2,
  MessageCircle,
  Mail,
  Trash2,
  ExternalLink,
  Eye,
  Loader2,
  Link as LinkIcon
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
  const { user, tenantName } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [links, setLinks] = useState<LandingPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailSentId, setEmailSentId] = useState<string | null>(null)

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
      patientName: patientName || '',
      number: documentNumber,
      clinicName: tenantName || '',
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

  // Filter to active links only
  const activeLinks = links.filter(lp => lp.active)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <Loader2 size={14} className="animate-spin" />
        {t('common.loading')}
      </div>
    )
  }

  if (activeLinks.length === 0) {
    return null // Don't show section if no links
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LinkIcon size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">
          {t('landing_pages.links.section.title')}
        </h3>
      </div>

      <div className="space-y-2">
        {activeLinks.map((lp) => {
          const url = lp.publicUrl || `${window.location.origin}/lp/${lp.accessToken}`
          const isExpired = lp.expiresAt ? new Date(lp.expiresAt) < new Date() : false

          return (
            <div
              key={lp.id}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-sm space-y-2"
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
                <StatusBadge status={isExpired ? 'expired' : 'active'} />
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendWhatsApp(lp)}
                    className="h-7 text-xs gap-1 text-green-700 hover:bg-green-50"
                    disabled={isExpired}
                  >
                    <MessageCircle size={13} />
                    {t('landing_pages.links.card.send_whatsapp')}
                  </Button>
                )}

                {patientEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(lp)}
                    disabled={sendingEmailId === lp.id || emailSentId === lp.id || isExpired}
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
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  className="h-7 text-xs gap-1"
                  disabled={isExpired}
                >
                  <ExternalLink size={13} />
                  {t('landing_pages.links.card.open')}
                </Button>

                {canEdit && (
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
      </div>
    </div>
  )
}
