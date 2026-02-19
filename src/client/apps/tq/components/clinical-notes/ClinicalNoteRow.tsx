import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Copy, Check } from 'lucide-react'
import { Button, Tooltip } from '@client/common/ui'
import { ClinicalNote } from '../../services/clinicalNotes'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

interface ClinicalNoteRowProps {
  note: ClinicalNote
  onEdit?: (note: ClinicalNote) => void
}

export const ClinicalNoteRow: React.FC<ClinicalNoteRowProps> = ({
  note,
  onEdit
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [copied, setCopied] = useState(false)

  const handleEdit = () => {
    onEdit?.(note)
  }

  const handleCopyNumber = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(note.number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const editLabel = t('common:edit')

  return (
    <div
      className="flex items-center gap-3 lg:gap-6 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onDoubleClick={handleEdit}
    >
      {/* Created At */}
      <div className="w-24">
        <span className="text-sm text-gray-600">
          {formatShortDate(note.created_at)}
        </span>
      </div>

      {/* Note Number */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 group/copy">
          <span className="font-medium text-gray-900 truncate">
            {note.number}
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
          {note.session_number || '—'}
        </span>
      </div>

      {/* Patient Name */}
      <div className="min-w-0 flex-1">
        {(() => {
          const name = note.patient_first_name || note.patient_last_name
            ? `${note.patient_first_name || ''} ${note.patient_last_name || ''}`.trim()
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
          const name = note.createdBy
            ? `${note.createdBy.firstName || ''} ${note.createdBy.lastName || ''}`.trim()
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
        <Tooltip content={canEdit ? editLabel : t('common.no_permission')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            disabled={!canEdit}
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
