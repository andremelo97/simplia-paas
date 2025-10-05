import React from 'react'
import { Button } from '@client/common/ui'
import { ExternalLink, Copy, Trash2, Eye, CheckCircle2 } from 'lucide-react'

interface PublicQuoteLinkRowProps {
  link: {
    id: string
    quoteNumber: string
    accessToken: string
    templateName?: string
    expiresAt?: string | null
    isExpired?: boolean
    active: boolean
    viewsCount: number
    createdAt: string
  }
  onCopy: (token: string) => void
  onRevoke: (id: string) => void
  onOpen: (token: string) => void
  copiedToken?: string | null
}

export const PublicQuoteLinkRow: React.FC<PublicQuoteLinkRowProps> = ({
  link,
  onCopy,
  onRevoke,
  onOpen,
  copiedToken
}) => {
  const publicUrl = `${window.location.origin}/public/${link.accessToken}`
  const isCopied = copiedToken === link.accessToken

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getExpirationStatus = () => {
    if (!link.expiresAt) {
      return { text: 'Never', className: 'text-gray-600' }
    }

    if (link.isExpired) {
      return { text: formatDate(link.expiresAt), className: 'text-red-600 font-medium' }
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(link.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry <= 7) {
      return { text: formatDate(link.expiresAt), className: 'text-orange-600 font-medium' }
    }

    return { text: formatDate(link.expiresAt), className: 'text-gray-900' }
  }

  const expirationStatus = getExpirationStatus()

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Quote Number */}
      <td className="px-6 py-4">
        <span className="font-medium text-gray-900">{link.quoteNumber}</span>
      </td>

      {/* Template */}
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{link.templateName || '-'}</span>
      </td>

      {/* Expiration */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${expirationStatus.className}`}>
            {expirationStatus.text}
          </span>
          {link.isExpired && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Expired
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            link.active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {link.active ? 'Active' : 'Revoked'}
        </span>
      </td>

      {/* Views */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Eye size={14} />
          <span>{link.viewsCount}</span>
        </div>
      </td>

      {/* Created */}
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600">{formatDate(link.createdAt)}</span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onCopy(link.accessToken)}
            className="flex items-center gap-1"
            title="Copy link"
          >
            {isCopied ? (
              <CheckCircle2 size={14} className="text-green-600" />
            ) : (
              <Copy size={14} />
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpen(link.accessToken)}
            className="flex items-center gap-1"
            title="Open link"
          >
            <ExternalLink size={14} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRevoke(link.id)}
            disabled={!link.active}
            className="flex items-center gap-1 text-red-600 hover:bg-red-50"
            title="Revoke link"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  )
}
