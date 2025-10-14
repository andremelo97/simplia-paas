import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@client/common/ui'
import { ClinicalReport } from '../../services/clinicalReports'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface ReportCardProps {
  report: ClinicalReport
  onDoubleClick: () => void
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onDoubleClick }) => {
  const { t } = useTranslation('tq')
  const [isFlashing, setIsFlashing] = useState(false)
  const { formatLongDate } = useDateFormatter()

  const handleDoubleClick = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 300)
    onDoubleClick()
  }

  const patientName = report.patient_first_name || report.patient_last_name
    ? `${report.patient_first_name || ''} ${report.patient_last_name || ''}`.trim()
    : t('sessions.unknown_patient')

  // Extract plain text preview from HTML content
  const getTextPreview = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    return text.slice(0, 100)
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 border-2 border-gray-300 ${
        isFlashing ? 'ring-2 ring-[#B725B7] ring-offset-2 scale-[1.02]' : ''
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-4">
        {/* Header with number */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{report.number}</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
            {t('clinical_reports.report')}
          </span>
        </div>

        {/* Patient name */}
        <p className="text-sm text-gray-600 mb-2">
          <strong>{t('common.patient')}:</strong> {patientName}
        </p>

        {/* Content preview */}
        {report.content && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {getTextPreview(report.content)}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-gray-500">
          {formatLongDate(report.created_at)}
        </p>
      </CardContent>
    </Card>
  )
}
