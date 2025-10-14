import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@client/common/ui'

interface TimelineItemProps {
  id: string
  type: 'session' | 'quote' | 'clinical' | 'event' | 'patient_registered'
  title: string
  preview?: string
  status?: string
  date: string
  icon: React.ReactNode
  onView?: () => void
  isFirst?: boolean
  isLast?: boolean
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  id,
  type,
  title,
  preview,
  status,
  date,
  icon,
  onView,
  isFirst = false,
  isLast = false
}) => {
  const { t } = useTranslation('tq')
  return (
    <div className="relative flex gap-4 pb-4 last:pb-0">
      {/* Spine Column */}
      <div className="relative flex flex-col items-center" style={{ width: '40px' }}>
        {/* Top connector line - hidden for first item */}
        {!isFirst && (
          <div
            className="absolute top-0 left-1/2 w-0.5 bg-gray-300"
            style={{
              height: '20px',
              transform: 'translateX(-50%)'
            }}
          />
        )}

        {/* Marker/Icon circle */}
        <div
          className="relative z-10 flex-shrink-0"
          style={{ marginTop: isFirst ? '0' : '20px' }}
          role="img"
          aria-label={`Timeline marker: ${type}`}
        >
          {icon}
        </div>

        {/* Bottom connector line - hidden for last item */}
        {!isLast && (
          <div
            className="absolute w-0.5 bg-gray-300"
            style={{
              top: isFirst ? '32px' : '52px',
              bottom: '-16px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          />
        )}
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0" style={{ marginTop: isFirst ? '0' : '20px' }}>
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {title}
                </h3>
                {status && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                      status === 'completed' || status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : status === 'draft'
                        ? 'bg-gray-100 text-gray-700'
                        : status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>

              {/* Date */}
              <p className="text-xs text-gray-500">
                {date}
              </p>
            </div>

            {/* View Button */}
            {onView && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={onView}
                className="text-sm flex-shrink-0"
              >
                {t('common.view')}
              </Button>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {preview}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
