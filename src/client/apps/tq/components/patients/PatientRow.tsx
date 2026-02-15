import React from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, History, Trash2 } from 'lucide-react'
import { Button, Tooltip } from '@client/common/ui'
import { Patient } from '../../services/patients'
import { formatPatientName } from '../../hooks/usePatients'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

interface PatientRowProps {
  patient: Patient
  onEdit?: (patient: Patient) => void
  onHistory?: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
}

export const PatientRow: React.FC<PatientRowProps> = ({
  patient,
  onEdit,
  onHistory,
  onDelete
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canDelete = user?.role !== 'operations'

  const historyLabel = t('patients.view_history')
  const editLabel = t('common:edit')
  const deleteLabel = t('common:delete')

  const handleEdit = () => {
    onEdit?.(patient)
  }

  const handleHistory = () => {
    onHistory?.(patient)
  }

  const handleDelete = () => {
    onDelete?.(patient)
  }

  return (
    <div
      className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onDoubleClick={handleEdit}
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Created At */}
        <div className="w-24">
          <span className="text-sm text-gray-600">
            {formatShortDate(patient.created_at)}
          </span>
        </div>

        {/* Nome */}
        <div className="min-w-0 flex-1">
          <span className="font-medium text-gray-900 truncate">
            {formatPatientName(patient)}
          </span>
        </div>

        {/* Email */}
        <div className="min-w-0 flex-1">
          <span className="text-gray-600 truncate">
            {patient.email || '—'}
          </span>
        </div>

        {/* Phone */}
        <div className="min-w-0 flex-1">
          <span className="text-gray-600 truncate">
            {patient.phone || '—'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Tooltip content={historyLabel}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHistory}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label={historyLabel}
          >
            <History className="w-4 h-4 text-gray-600" />
          </Button>
        </Tooltip>

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

        <Tooltip content={canDelete ? deleteLabel : t('common.no_permission')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={!canDelete}
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

