import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, StatusBadge } from '@client/common/ui'
import { ExternalLink, Copy, Trash2, CheckCircle2, FileText } from 'lucide-react'
import { PublicQuote } from '../../services/publicQuotes'

interface PublicQuoteLinkRowProps {
  publicQuote: PublicQuote
  onRevoke: () => void
}

export const PublicQuoteLinkRow: React.FC<PublicQuoteLinkRowProps> = ({
  publicQuote,
  onRevoke
}) => {
  const navigate = useNavigate()
  const [copied, setCopied] = React.useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

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
      return { text: 'Never', className: 'text-gray-600' }
    }

    const expiryDate = new Date(publicQuote.expiresAt)
    const now = new Date()
    const isExpired = expiryDate < now

    if (isExpired) {
      return { text: formatDate(publicQuote.expiresAt), className: 'text-red-600 font-medium' }
    }

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 7) {
      return { text: formatDate(publicQuote.expiresAt), className: 'text-orange-600 font-medium' }
    }

    return { text: formatDate(publicQuote.expiresAt), className: 'text-gray-900' }
  }

  const expirationStatus = getExpirationStatus()
  const isExpired = publicQuote.expiresAt ? new Date(publicQuote.expiresAt) < new Date() : false

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              Quote #{publicQuote.quote?.number || 'N/A'}
            </span>
            <StatusBadge status={publicQuote.active ? 'active' : 'revoked'} />
            {isExpired && (
              <StatusBadge status="expired" />
            )}
          </div>
          <div className="text-sm text-gray-600">
            Template: {publicQuote.template?.name || 'Default'}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-500 mb-1">Expiration</div>
          <div className={expirationStatus.className}>{expirationStatus.text}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Views</div>
          <div className="text-gray-900">
            {publicQuote.viewsCount}
          </div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Created</div>
          <div className="text-gray-900">{formatDate(publicQuote.createdAt)}</div>
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
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Link
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
          Open
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenQuote}
          className="flex items-center gap-1.5"
          disabled={!publicQuote.quoteId}
        >
          <FileText size={14} />
          Open Quote
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRevoke}
          disabled={!publicQuote.active}
          className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 ml-auto"
        >
          <Trash2 size={14} />
          Revoke
        </Button>
      </div>
    </div>
  )
}
