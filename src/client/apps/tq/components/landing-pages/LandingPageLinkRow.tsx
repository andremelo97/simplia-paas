import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, StatusBadge } from '@client/common/ui'
import { ExternalLink, Copy, Trash2, CheckCircle2, FileText, Key } from 'lucide-react'
import { LandingPage } from '../../services/landingPages'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

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
  const { formatShortDate, formatDateTime } = useDateFormatter()
  const { t } = useTranslation('tq')
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const handleCopy = () => {
    if (landingPage.publicUrl) {
      navigator.clipboard.writeText(landingPage.publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenExternal = () => {
    if (landingPage.publicUrl) {
      window.open(landingPage.publicUrl, '_blank')
    }
  }

  const handleOpenDocument = () => {
    if (landingPage.documentType === 'prevention' && landingPage.prevention?.id) {
      navigate(`/documents/prevention/${landingPage.prevention.id}/edit`)
    } else if (landingPage.quote?.id) {
      navigate(`/documents/quote/${landingPage.quote.id}/edit`)
    }
  }

  const getExpirationStatus = () => {
    if (!landingPage.expiresAt) {
      return { text: t('common.never'), className: 'text-gray-600' }
    }

    const expiryDate = new Date(landingPage.expiresAt)
    const now = new Date()
    const isExpired = expiryDate < now

    if (isExpired) {
      return { text: formatShortDate(landingPage.expiresAt), className: 'text-red-600 font-medium' }
    }

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 7) {
      return { text: formatShortDate(landingPage.expiresAt), className: 'text-orange-600 font-medium' }
    }

    return { text: formatShortDate(landingPage.expiresAt), className: 'text-gray-900' }
  }

  const expirationStatus = getExpirationStatus()
  const isExpired = landingPage.expiresAt ? new Date(landingPage.expiresAt) < new Date() : false

  // Get document number (quote or prevention)
  const documentNumber = landingPage.quote?.number || landingPage.prevention?.number || t('landing_pages.links.card.not_available')
  const documentType = landingPage.documentType === 'prevention' ? t('common.prevention') : t('common.quote')

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {documentType}: {documentNumber}
            </span>
            <StatusBadge status={landingPage.active ? 'active' : 'revoked'} />
            {isExpired && (
              <StatusBadge status="expired" />
            )}
          </div>
          <div className="text-sm text-gray-600">
            {t('landing_pages.links.card.template', {
              name: landingPage.template?.name || t('landing_pages.links.card.template_default')
            })}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500 mb-1">{t('landing_pages.links.card.expiration')}</div>
          <div className={expirationStatus.className}>{expirationStatus.text}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">{t('landing_pages.links.card.views')}</div>
          <div className="text-gray-900">
            {landingPage.viewsCount}
          </div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">{t('landing_pages.links.card.created')}</div>
          <div className="text-gray-900">{formatDateTime(landingPage.createdAt)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1.5"
          disabled={!landingPage.publicUrl}
        >
          {copied ? (
            <>
              <CheckCircle2 size={14} className="text-green-600" />
              {t('landing_pages.links.card.copied')}
            </>
          ) : (
            <>
              <Copy size={14} />
              {t('landing_pages.links.card.copy_link')}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenExternal}
          className="flex items-center gap-1.5"
          disabled={!landingPage.publicUrl}
        >
          <ExternalLink size={14} />
          {t('landing_pages.links.card.open')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDocument}
          className="flex items-center gap-1.5"
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
            className="flex items-center gap-1.5"
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
            className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 ml-auto"
          >
            <Trash2 size={14} />
            {t('landing_pages.links.card.revoke')}
          </Button>
        )}
      </div>
    </div>
  )
}
