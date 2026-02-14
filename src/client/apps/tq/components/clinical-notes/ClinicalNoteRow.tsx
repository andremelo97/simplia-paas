import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, FileText } from 'lucide-react'
import { Button, Tooltip } from '@client/common/ui'
import { ClinicalNote } from '../../services/clinicalNotes'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

interface ClinicalNoteRowProps {
  note: ClinicalNote
  onEdit?: (note: ClinicalNote) => void
  onView?: (note: ClinicalNote) => void
}

export const ClinicalNoteRow: React.FC<ClinicalNoteRowProps> = ({
  note,
  onEdit,
  onView
}) => {
  const { t } = useTranslation('tq')
  const [isHovered, setIsHovered] = useState(false)
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const handleEdit = () => {
    onEdit?.(note)
  }

  const handleView = () => {
    onView?.(note)
  }

  const viewLabel = t('common:view')
  const editLabel = t('common:edit')

  return (
    <div
      className="flex items-center gap-6 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Created At */}
      <div className="w-24">
        <span className="text-sm text-gray-600">
          {formatShortDate(note.created_at)}
        </span>
      </div>

      {/* Note Number */}
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-900 truncate">
          {note.number}
        </span>
      </div>

      {/* Session Number */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 truncate">
          {note.session_number || '—'}
        </span>
      </div>

      {/* Patient Name */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 truncate">
          {note.patient_first_name || note.patient_last_name
            ? `${note.patient_first_name || ''} ${note.patient_last_name || ''}`.trim()
            : '—'
          }
        </span>
      </div>

      {/* Created By */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 truncate">
          {note.createdBy
            ? `${note.createdBy.firstName || ''} ${note.createdBy.lastName || ''}`.trim()
            : '—'
          }
        </span>
      </div>

      {/* Actions - visible on hover - Fixed width to match header */}
      <div className={`w-24 flex items-center justify-end gap-1 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <Tooltip content={viewLabel}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="h-8 w-8 p-0 hover:bg-purple-100"
            aria-label={viewLabel}
          >
            <FileText className="w-4 h-4 text-purple-600" />
          </Button>
        </Tooltip>

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
