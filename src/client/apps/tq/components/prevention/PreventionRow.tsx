import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Copy, Check } from 'lucide-react'
import { Button, Tooltip } from '@client/common/ui'
import { Prevention } from '../../services/prevention'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

interface PreventionRowProps {
  prevention: Prevention
  onEdit?: (prevention: Prevention) => void
}

export const PreventionRow: React.FC<PreventionRowProps> = ({
  prevention,
  onEdit
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [copied, setCopied] = useState(false)

  const handleEdit = () => {
    onEdit?.(prevention)
  }

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(prevention.number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const editLabel = t('common:edit')

  return (
    <div
      className="flex items-center gap-6 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onDoubleClick={handleEdit}
    >
      {/* Created At */}
      <div className="w-24">
        <span className="text-sm text-gray-600">
          {formatShortDate(prevention.createdAt)}
        </span>
      </div>

      {/* Prevention Number */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 group/copy">
          <span className="font-medium text-gray-900 truncate">
            {prevention.number}
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

      {/* Session Number */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 block truncate">
          {prevention.session_number || '—'}
        </span>
      </div>

      {/* Patient Name */}
      <div className="min-w-0 flex-1">
        {(() => {
          const name = prevention.patient_first_name || prevention.patient_last_name
            ? `${prevention.patient_first_name || ''} ${prevention.patient_last_name || ''}`.trim()
            : '—'
          return (
            <Tooltip content={name} disabled={name === '—'}>
              <span className="text-gray-600 block truncate">{name}</span>
            </Tooltip>
          )
        })()}
      </div>

      {/* Created By */}
      <div className="min-w-0 flex-1">
        {(() => {
          const name = prevention.createdBy
            ? `${prevention.createdBy.firstName || ''} ${prevention.createdBy.lastName || ''}`.trim()
            : '—'
          return (
            <Tooltip content={name} disabled={name === '—'}>
              <span className="text-gray-600 block truncate">{name}</span>
            </Tooltip>
          )
        })()}
      </div>

      {/* Actions */}
      <div className="w-24 flex items-center justify-end gap-1">
        {canEdit && (
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
        )}
      </div>
    </div>
  )
}
