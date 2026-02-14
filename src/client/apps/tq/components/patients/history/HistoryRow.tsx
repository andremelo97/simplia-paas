import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@client/common/ui'

interface HistoryRowProps {
  id: string
  type: 'session' | 'quote' | 'clinical' | 'prevention' | 'event' | 'patient_registered'
  title: string
  preview?: string
  status?: string
  date: string
  icon: React.ReactNode
  viewPath?: string
}

export const HistoryRow: React.FC<HistoryRowProps> = ({
  id,
  type,
  title,
  preview,
  status,
  date,
  icon,
  viewPath
}) => {
  const { t } = useTranslation('tq')

  const handleViewClick = (e: React.MouseEvent) => {
    if (!viewPath) return

    // Se Ctrl (Windows/Linux) ou Cmd (Mac) estiver pressionado, abre em nova aba
    if (e.ctrlKey || e.metaKey) {
      window.open(viewPath, '_blank', 'noopener,noreferrer')
    } else {
      // Senão, abre na mesma aba
      window.location.href = viewPath
    }
  }

  const getTranslatedStatus = (status: string, type: string) => {
    // Determine the correct translation namespace based on type
    if (type === 'session') {
      return t(`sessions.status.${status}`)
    } else if (type === 'quote') {
      return t(`quotes.status.${status}`)
    } else if (type === 'prevention') {
      return t(`prevention.status.${status}`)
    }
    return status
  }

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
              {getTranslatedStatus(status, type)}
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
      {viewPath && (
        <div className="flex-shrink-0">
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleViewClick}
            className="text-sm"
          >
            {t('common.view')}
          </Button>
        </div>
      )}
    </div>
  )
}
