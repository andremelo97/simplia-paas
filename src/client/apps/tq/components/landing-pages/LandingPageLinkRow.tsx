import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, StatusBadge, Tooltip } from '@client/common/ui'
import { ExternalLink, Copy, Trash2, CheckCircle2, FileText, Key, Eye, MessageCircle, Mail, Loader2 } from 'lucide-react'
import { LandingPage, landingPagesService } from '../../services/landingPages'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'
import { cleanPhoneForWhatsApp } from '../../utils/phone'

interface LandingPageLinkRowProps {
  landingPage: LandingPage
  onRevoke: () => void
  onNewPassword: () => void
  isNewPasswordLoading?: boolean
}

export const LandingPageLinkRow: React.FC<LandingPageLinkRowProps> = ({
  landingPage,
  onRevoke,
  onNewPassword,
  isNewPasswordLoading = false
}) => {
  const navigate = useNavigate()
  const [copied, setCopied] = React.useState(false)
  const [copiedPassword, setCopiedPassword] = React.useState(false)
  const [sendingEmail, setSendingEmail] = React.useState(false)
  const [emailSent, setEmailSent] = React.useState(false)
  const { formatShortDate } = useDateFormatter()
  const { t } = useTranslation('tq')
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const url = landingPage.publicUrl || `${window.location.origin}/lp/${landingPage.accessToken}`
  const isExpired = landingPage.expiresAt ? new Date(landingPage.expiresAt) < new Date() : false
  const status: 'active' | 'revoked' | 'expired' = !landingPage.active ? 'revoked' : isExpired ? 'expired' : 'active'
  const isDisabled = status !== 'active'

  const documentNumber = landingPage.quote?.number || landingPage.prevention?.number || t('landing_pages.links.card.not_available')
  const documentType = landingPage.documentType === 'prevention' ? t('common.prevention') : t('common.quote')

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPassword = () => {
    if (!landingPage.password) return
    navigator.clipboard.writeText(landingPage.password)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  const handleOpenDocument = () => {
    if (landingPage.documentType === 'prevention' && landingPage.prevention?.id) {
      navigate(`/documents/prevention/${landingPage.prevention.id}/edit`)
    } else if (landingPage.quote?.id) {
      navigate(`/documents/quote/${landingPage.quote.id}/edit`)
    }
  }

  const patient = landingPage.quote?.patient || landingPage.prevention?.patient
  const patientPhone = patient?.phone
  const patientEmail = patient?.email
  const patientPhoneCountryCode = patient?.phoneCountryCode

  const handleSendWhatsApp = () => {
    if (!patientPhone) return

    const messageKey = landingPage.documentType === 'quote'
      ? 'modals.generate_public_quote.whatsapp_message_quote'
      : 'modals.generate_public_quote.whatsapp_message_prevention'

    const message = t(messageKey, {
      link: url,
      password: landingPage.password || ''
    })

    const phone = cleanPhoneForWhatsApp(patientPhone, patientPhoneCountryCode)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      await landingPagesService.sendEmail(landingPage.id)
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch {
      // HTTP interceptor handles feedback
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div
      className={`border border-gray-200 rounded-lg p-3 text-sm space-y-2 ${isDisabled ? 'bg-gray-50 opacity-75' : 'bg-gray-50/50'}`}
    >
      {/* Row 1: Document info + URL + Status + Views + Date */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-gray-900 text-sm">
          {documentType}: {documentNumber}
        </span>

        <span className="text-gray-400">|</span>

        <code className="text-sm bg-white border border-gray-200 rounded px-2 py-0.5 truncate max-w-[13.75rem] flex-1">
          {url}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-1.5 text-sm gap-1"
        >
          {copied ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
        </Button>

        {landingPage.password && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">{t('landing_pages.links.card.password')}:</span>
            <code className="text-sm bg-white border border-gray-200 rounded px-2 py-0.5 font-mono">
              {landingPage.password}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPassword}
              className="h-7 px-1.5 text-sm gap-1"
            >
              {copiedPassword ? <CheckCircle2 size={14} className="text-green-600" /> : <Copy size={14} />}
            </Button>
          </>
        )}

        <span className="text-gray-400">|</span>
        <StatusBadge status={status} />
        <span className="text-sm text-gray-500">
          <Eye size={14} className="inline mr-0.5" />{landingPage.viewsCount}
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-500">
          {formatShortDate(landingPage.createdAt)}
        </span>
        {landingPage.expiresAt && (
          <span className="text-sm text-gray-500">
            — {formatShortDate(landingPage.expiresAt)}
          </span>
        )}
      </div>

      {/* Row 2: Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tooltip
          content={isDisabled ? t('landing_pages.links.card.generate_new_link') : t('modals.generate_public_quote.whatsapp_no_phone')}
          disabled={!isDisabled && !!patientPhone}
          side="bottom"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendWhatsApp}
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
            onClick={handleSendEmail}
            disabled={isDisabled || !patientEmail || sendingEmail || emailSent}
            className="h-7 text-sm gap-1 text-purple-700 hover:bg-purple-50"
          >
            {sendingEmail ? (
              <Loader2 size={14} className="animate-spin" />
            ) : emailSent ? (
              <CheckCircle2 size={14} />
            ) : (
              <Mail size={14} />
            )}
            {sendingEmail
              ? t('landing_pages.links.card.sending_email')
              : emailSent
                ? t('landing_pages.links.card.email_sent')
                : t('landing_pages.links.card.send_email')
            }
          </Button>
        </Tooltip>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/landing-pages/links/${landingPage.id}/preview`, '_blank')}
          className="h-7 text-sm gap-1"
        >
          <Eye size={14} />
          {t('landing_pages.links.card.preview')}
        </Button>

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

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDocument}
          className="h-7 text-sm gap-1"
          disabled={!landingPage.quote?.id && !landingPage.prevention?.id}
        >
          <FileText size={14} />
          {t('landing_pages.links.card.open_document')}
        </Button>

        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNewPassword}
            disabled={!landingPage.active}
            isLoading={isNewPasswordLoading}
            className="h-7 text-sm gap-1"
          >
            <Key size={14} />
            {t('landing_pages.links.card.new_password')}
          </Button>
        )}

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRevoke}
            disabled={!landingPage.active}
            className="h-7 text-sm gap-1 text-red-600 hover:bg-red-50 ml-auto"
          >
            <Trash2 size={14} />
            {t('landing_pages.links.card.revoke')}
          </Button>
        )}
      </div>
    </div>
  )
}
