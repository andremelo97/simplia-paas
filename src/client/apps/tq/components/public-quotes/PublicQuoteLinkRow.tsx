import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, StatusBadge } from '@client/common/ui'
import { ExternalLink, Copy, Trash2, CheckCircle2, FileText, Key } from 'lucide-react'
import { PublicQuote } from '../../services/publicQuotes'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface PublicQuoteLinkRowProps {
  publicQuote: PublicQuote
  onRevoke: () => void
  onNewPassword: () => void
}

export const PublicQuoteLinkRow: React.FC<PublicQuoteLinkRowProps> = ({
  publicQuote,
  onRevoke,
  onNewPassword
}) => {
  const navigate = useNavigate()
  const [copied, setCopied] = React.useState(false)
  const { formatShortDate, formatDateTime } = useDateFormatter()
  const { t } = useTranslation('tq')

  const handleCopy = () => {
    if (publicQuote.publicUrl) {
      navigator.clipboard.writeText(publicQuote.publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenExternal = () => {
    if (publicQuote.publicUrl) {
      window.open(publicQuote.publicUrl, '_blank')
    }
  }

  const handleOpenQuote = () => {
    if (publicQuote.quoteId) {
      navigate(`/quotes/${publicQuote.quoteId}/edit`)
    }
  }

  const getExpirationStatus = () => {
    if (!publicQuote.expiresAt) {
      return { text: t('common.never'), className: 'text-gray-600' }
    }

    const expiryDate = new Date(publicQuote.expiresAt)
    const now = new Date()
    const isExpired = expiryDate < now

    if (isExpired) {
      return { text: formatShortDate(publicQuote.expiresAt), className: 'text-red-600 font-medium' }
    }

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 7) {
      return { text: formatShortDate(publicQuote.expiresAt), className: 'text-orange-600 font-medium' }
    }

    return { text: formatShortDate(publicQuote.expiresAt), className: 'text-gray-900' }
  }

  const expirationStatus = getExpirationStatus()
  const isExpired = publicQuote.expiresAt ? new Date(publicQuote.expiresAt) < new Date() : false
  const quoteNumber = publicQuote.quote?.number || t('public_quotes.links.card.not_available')

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {t('public_quotes.links.card.quote_title', { number: quoteNumber })}
            </span>
            <StatusBadge status={publicQuote.active ? 'active' : 'revoked'} />
            {isExpired && (
              <StatusBadge status="expired" />
            )}
          </div>
          <div className="text-sm text-gray-600">
            {t('public_quotes.links.card.template', {
              name: publicQuote.template?.name || t('public_quotes.links.card.template_default')
            })}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500 mb-1">{t('public_quotes.links.card.expiration')}</div>
          <div className={expirationStatus.className}>{expirationStatus.text}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">{t('public_quotes.links.card.views')}</div>
          <div className="text-gray-900">
            {publicQuote.viewsCount}
          </div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">{t('public_quotes.links.card.created')}</div>
          <div className="text-gray-900">{formatDateTime(publicQuote.createdAt)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1.5"
          disabled={!publicQuote.publicUrl}
        >
          {copied ? (
            <>
              <CheckCircle2 size={14} className="text-green-600" />
              {t('public_quotes.links.card.copied')}
            </>
          ) : (
            <>
              <Copy size={14} />
              {t('public_quotes.links.card.copy_link')}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenExternal}
          className="flex items-center gap-1.5"
          disabled={!publicQuote.publicUrl}
        >
          <ExternalLink size={14} />
          {t('public_quotes.links.card.open')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenQuote}
          className="flex items-center gap-1.5"
          disabled={!publicQuote.quoteId}
        >
          <FileText size={14} />
          {t('public_quotes.links.card.open_quote')}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewPassword}
          disabled={!publicQuote.active}
          className="flex items-center gap-1.5"
        >
          <Key size={14} />
          {t('public_quotes.links.card.new_password')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRevoke}
          disabled={!publicQuote.active}
          className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 ml-auto"
        >
          <Trash2 size={14} />
          {t('public_quotes.links.card.revoke')}
        </Button>
      </div>
    </div>
  )
}
