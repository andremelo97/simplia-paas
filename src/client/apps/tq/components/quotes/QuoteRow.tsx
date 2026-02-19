import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Copy, Check } from 'lucide-react'
import { Button, Badge, Tooltip } from '@client/common/ui'
import { Quote } from '../../services/quotes'
import { formatQuoteStatus } from '../../hooks/useQuotes'
import { getQuoteStatusColor } from '../../types/quoteStatus'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'

interface QuoteRowProps {
  quote: Quote
  onEdit?: (quote: Quote) => void
}

export const QuoteRow: React.FC<QuoteRowProps> = ({
  quote,
  onEdit
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const { formatCurrency } = useCurrencyFormatter()

  const [copied, setCopied] = useState(false)

  const handleEdit = () => {
    onEdit?.(quote)
  }

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(quote.number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const editLabel = t('common:edit')

  return (
    <>
      {/* Mobile card layout */}
      <div
        className="md:hidden py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={handleEdit}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900">{quote.number}</span>
          <Badge className={getQuoteStatusColor(quote.status)}>
            {formatQuoteStatus(quote.status)}
          </Badge>
        </div>
        <div className="text-sm text-gray-600">
          {quote.patient_first_name || quote.patient_last_name
            ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim()
            : '—'}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-400">{formatShortDate(quote.created_at)}</span>
          <span className="text-sm font-medium text-gray-900">{formatCurrency(quote.total || 0)}</span>
        </div>
      </div>

      {/* Desktop/Tablet row layout */}
      <div
        className="hidden md:flex items-center gap-3 lg:gap-6 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onDoubleClick={handleEdit}
      >
      {/* Created At */}
      <div className="w-24">
        <span className="text-sm text-gray-600">
          {formatShortDate(quote.created_at)}
        </span>
      </div>

      {/* Quote Number */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 group/copy">
          <span className="font-medium text-gray-900 truncate">
            {quote.number}
          </span>
          <Tooltip content={copied ? t('common:copied') : t('common:copy_number')}>
            <button
              onClick={handleCopyNumber}
              className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-200 flex-shrink-0"
              aria-label={t('common:copy_number')}
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-600" />
                : <Copy className="w-3.5 h-3.5 text-gray-400" />
              }
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Session Number — hidden on tablet */}
      <div className="hidden lg:block min-w-0 flex-1">
        <span className="text-gray-600 block truncate">
          {quote.session_number || '—'}
        </span>
      </div>

      {/* Status */}
      <div className="min-w-0 flex-1">
        <Badge className={getQuoteStatusColor(quote.status)}>
          {formatQuoteStatus(quote.status)}
        </Badge>
      </div>

      {/* Patient Name */}
      <div className="min-w-0 flex-1">
        {(() => {
          const name = quote.patient_first_name || quote.patient_last_name
            ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim()
            : '—'
          return (
            <Tooltip content={name} disabled={name === '—'}>
              <span className="text-gray-600 block truncate">{name}</span>
            </Tooltip>
          )
        })()}
      </div>

      {/* Created By — hidden on tablet */}
      <div className="hidden lg:block min-w-0 flex-1">
        {(() => {
          const name = quote.createdBy
            ? `${quote.createdBy.firstName || ''} ${quote.createdBy.lastName || ''}`.trim()
            : '—'
          return (
            <Tooltip content={name} disabled={name === '—'}>
              <span className="text-gray-600 block truncate">{name}</span>
            </Tooltip>
          )
        })()}
      </div>

      {/* Total */}
      <div className="w-24">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(quote.total || 0)}
        </span>
      </div>

      {/* Actions */}
      <div className="w-20 flex items-center justify-end">
        <Tooltip content={editLabel}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label={editLabel}
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
        </Tooltip>
      </div>
    </div>
    </>
  )
}
