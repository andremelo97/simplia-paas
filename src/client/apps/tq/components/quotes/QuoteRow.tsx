import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit } from 'lucide-react'
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
  const [isHovered, setIsHovered] = useState(false)
  const { formatShortDate } = useDateFormatter()
  const { formatCurrency } = useCurrencyFormatter()

  const handleEdit = () => {
    onEdit?.(quote)
  }

  const editLabel = t('common:edit')

  return (
    <div
      className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Created At */}
        <div className="w-24">
          <span className="text-sm text-gray-600">
            {formatShortDate(quote.created_at)}
          </span>
        </div>

        {/* Quote Number */}
        <div className="min-w-0 flex-1">
          <span className="font-medium text-gray-900 truncate">
            {quote.number}
          </span>
        </div>

        {/* Session Number */}
        <div className="min-w-0 flex-1">
          <span className="text-gray-600 truncate">
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
          <span className="text-gray-600 truncate">
            {quote.patient_first_name || quote.patient_last_name
              ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim()
              : '—'
            }
          </span>
        </div>

        {/* Total */}
        <div className="w-24">
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(quote.total || 0)}
          </span>
        </div>
      </div>

      {/* Actions - visible on hover */}
      <div className={`flex items-center gap-1 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
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
  )
}
