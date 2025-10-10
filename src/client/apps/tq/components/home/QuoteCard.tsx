import React, { useState } from 'react'
import { Card, CardContent } from '@client/common/ui'
import { Quote } from '../../services/quotes'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface QuoteCardProps {
  quote: Quote
  onDoubleClick: () => void
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onDoubleClick }) => {
  const [isFlashing, setIsFlashing] = useState(false)
  const { formatLongDate } = useDateFormatter()

  const handleDoubleClick = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 300)
    onDoubleClick()
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-yellow-100 text-yellow-700'
  }

  const borderColors = {
    draft: 'border-gray-300',
    sent: 'border-blue-300',
    approved: 'border-green-300',
    rejected: 'border-red-300',
    expired: 'border-yellow-300'
  }

  const patientName = quote.patient_first_name || quote.patient_last_name
    ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim()
    : 'Unknown Patient'

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 border-2 ${borderColors[quote.status]} ${
        isFlashing ? 'ring-2 ring-[#B725B7] ring-offset-2 scale-[1.02]' : ''
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-4">
        {/* Header with number and status */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{quote.number}</h3>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[quote.status]}`}>
            {quote.status}
          </span>
        </div>

        {/* Patient name */}
        <p className="text-sm text-gray-600 mb-2">
          <strong>Patient:</strong> {patientName}
        </p>

        {/* Total value */}
        <p className="text-lg font-bold text-gray-900 mb-2">
          ${quote.total?.toFixed(2) || '0.00'}
        </p>

        {/* Date */}
        <p className="text-xs text-gray-500">
          {formatLongDate(quote.created_at)}
        </p>
      </CardContent>
    </Card>
  )
}
