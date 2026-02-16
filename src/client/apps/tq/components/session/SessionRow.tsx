import React from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2 } from 'lucide-react'
import { Button, Badge, Tooltip } from '@client/common/ui'
import { Session } from '../../services/sessions'
import { formatSessionStatus } from '../../hooks/useSessions'
import { getSessionStatusColor } from '../../types/sessionStatus'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

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
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const handleEdit = () => {
    onEdit?.(session)
  }

  const handleDelete = () => {
    onDelete?.(session)
  }

  const editLabel = t('common:edit')
  const deleteLabel = t('common:delete')

  const patientName = session.patient_first_name || session.patient_last_name
    ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
    : '—'

  const createdByName = session.createdBy
    ? `${session.createdBy.firstName || ''} ${session.createdBy.lastName || ''}`.trim()
    : '—'

  return (
    <>
      {/* Mobile card layout */}
      <div
        className="md:hidden py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={handleEdit}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900">{session.number}</span>
          <Badge className={getSessionStatusColor(session.status)}>
            {formatSessionStatus(session.status)}
          </Badge>
        </div>
        <div className="text-sm text-gray-600">{patientName}</div>
        <div className="text-xs text-gray-400 mt-0.5">{formatShortDate(session.created_at)}</div>
      </div>

      {/* Desktop/Tablet row layout */}
      <div
        className="hidden md:flex items-center gap-3 lg:gap-6 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onDoubleClick={handleEdit}
      >
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
          <span className="text-gray-600 truncate">{patientName}</span>
        </div>

        {/* Created By - hidden on tablet */}
        <div className="min-w-0 flex-1 hidden lg:block">
          <span className="text-gray-600 truncate">{createdByName}</span>
        </div>

        {/* Actions */}
        <div className="w-24 flex items-center justify-end gap-1">
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

          <Tooltip content={canEdit ? deleteLabel : t('common.no_permission')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={!canEdit}
              className="h-8 w-8 p-0 hover:bg-red-100"
              aria-label={deleteLabel}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </Tooltip>
        </div>
      </div>
    </>
  )
}
