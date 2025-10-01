import React from 'react'
import { Button } from '@client/common/ui'

interface HistoryRowProps {
  id: string
  type: 'session' | 'quote' | 'clinical' | 'event' | 'patient_registered'
  title: string
  preview?: string
  status?: string
  date: string
  icon: React.ReactNode
  onView?: () => void
}

export const HistoryRow: React.FC<HistoryRowProps> = ({
  id,
  type,
  title,
  preview,
  status,
  date,
  icon,
  onView
}) => {
  return (
    <div className="flex items-start gap-4 py-4 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Icon/Avatar */}
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
          {status && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              status === 'completed' || status === 'approved'
                ? 'bg-green-100 text-green-700'
                : status === 'draft'
                ? 'bg-gray-100 text-gray-700'
                : status === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {status}
            </span>
          )}
        </div>

        {preview && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {preview}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {type !== 'event' && type !== 'patient_registered' && id && (
            <span>ID: {id}</span>
          )}
          <span>{date}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0">
        <Button
          variant="tertiary"
          size="sm"
          onClick={onView}
          className="text-sm"
        >
          View
        </Button>
      </div>
    </div>
  )
}
