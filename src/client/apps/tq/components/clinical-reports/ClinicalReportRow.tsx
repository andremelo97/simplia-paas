import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, FileText } from 'lucide-react'
import { Button, Tooltip } from '@client/common/ui'
import { ClinicalReport } from '../../services/clinicalReports'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface ClinicalReportRowProps {
  report: ClinicalReport
  onEdit?: (report: ClinicalReport) => void
  onView?: (report: ClinicalReport) => void
}

export const ClinicalReportRow: React.FC<ClinicalReportRowProps> = ({
  report,
  onEdit,
  onView
}) => {
  const { t } = useTranslation('tq')
  const [isHovered, setIsHovered] = useState(false)
  const { formatShortDate } = useDateFormatter()

  const handleEdit = () => {
    onEdit?.(report)
  }

  const handleView = () => {
    onView?.(report)
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
          {formatShortDate(report.created_at)}
        </span>
      </div>

      {/* Report Number */}
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-900 truncate">
          {report.number}
        </span>
      </div>

      {/* Session Number */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 truncate">
          {report.session_number || '—'}
        </span>
      </div>

      {/* Patient Name */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 truncate">
          {report.patient_first_name || report.patient_last_name
            ? `${report.patient_first_name || ''} ${report.patient_last_name || ''}`.trim()
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
      </div>
    </div>
  )
}
