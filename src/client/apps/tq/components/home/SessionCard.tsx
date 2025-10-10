import React, { useState } from 'react'
import { Card, CardContent } from '@client/common/ui'
import { Session } from '../../services/sessions'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface SessionCardProps {
  session: Session
  onDoubleClick: () => void
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onDoubleClick }) => {
  const [isFlashing, setIsFlashing] = useState(false)
  const { formatLongDate } = useDateFormatter()

  const handleDoubleClick = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 300)
    onDoubleClick()
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const borderColors = {
    draft: 'border-gray-300',
    completed: 'border-green-300',
    in_progress: 'border-blue-300',
    cancelled: 'border-red-300'
  }

  const patientName = session.patient_first_name || session.patient_last_name
    ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
    : 'Unknown Patient'

  const status = (session.status || 'draft') as keyof typeof statusColors

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 border-2 ${borderColors[status]} ${
        isFlashing ? 'ring-2 ring-[#B725B7] ring-offset-2 scale-[1.02]' : ''
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-4">
        {/* Header with number and status */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{session.number}</h3>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[status]}`}>
            {status}
          </span>
        </div>

        {/* Patient name */}
        <p className="text-sm text-gray-600 mb-2">
          <strong>Patient:</strong> {patientName}
        </p>

        {/* Transcription preview or placeholder */}
        {session.transcription_text && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {session.transcription_text}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-gray-500">
          {formatLongDate(session.created_at)}
        </p>
      </CardContent>
    </Card>
  )
}
