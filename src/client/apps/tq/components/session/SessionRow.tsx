import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2 } from 'lucide-react'
import { Button, Badge, Tooltip } from '@client/common/ui'
import { Session } from '../../services/sessions'
import { formatSessionStatus } from '../../hooks/useSessions'
import { getSessionStatusColor } from '../../types/sessionStatus'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface SessionRowProps {
  session: Session
  onEdit?: (session: Session) => void
  onDelete?: (session: Session) => void
}

export const SessionRow: React.FC<SessionRowProps> = ({
  session,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation('tq')
  const [isHovered, setIsHovered] = useState(false)
  const { formatShortDate } = useDateFormatter()

  const handleEdit = () => {
    onEdit?.(session)
  }

  const handleDelete = () => {
    onDelete?.(session)
  }

  const editLabel = t('common:edit')
  const deleteLabel = t('common:delete')

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
            {formatShortDate(session.created_at)}
          </span>
        </div>

        {/* Session Number */}
        <div className="min-w-0 flex-1">
          <span className="font-medium text-gray-900 truncate">
            {session.number}
          </span>
        </div>

        {/* Status */}
        <div className="min-w-0 flex-1">
          <Badge className={getSessionStatusColor(session.status)}>
            {formatSessionStatus(session.status)}
          </Badge>
        </div>

        {/* Patient Name */}
        <div className="min-w-0 flex-1">
          <span className="text-gray-600 truncate">
            {session.patient_first_name || session.patient_last_name
              ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
              : '—'
            }
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

        <Tooltip content={deleteLabel}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 hover:bg-red-100"
            aria-label={deleteLabel}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
