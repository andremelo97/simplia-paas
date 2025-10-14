import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Patient } from '../../services/patients'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface RecentPatientRowProps {
  patient: Patient
  onDoubleClick: () => void
  isLast?: boolean
}

export const RecentPatientRow: React.FC<RecentPatientRowProps> = ({
  patient,
  onDoubleClick,
  isLast = false
}) => {
  const { t } = useTranslation('tq')
  const [isFlashing, setIsFlashing] = useState(false)
  const { formatMonthYear } = useDateFormatter()

  const handleDoubleClick = () => {
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 300)
    onDoubleClick()
  }

  const patientName = patient.first_name || patient.last_name
    ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
    : t('patients.unnamed_patient')

  const secondaryInfo = patient.email || patient.phone || t('patients.no_contact_info')

  // Get initials for avatar
  const initials = (
    (patient.first_name?.[0] || '') + (patient.last_name?.[0] || '')
  ).toUpperCase() || 'U'

  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
        !isLast ? 'border-b border-gray-100' : ''
      } ${isFlashing ? 'ring-2 ring-[#B725B7] ring-inset bg-purple-50' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#5ED6CE] font-semibold text-sm">
        {initials}
      </div>

      {/* Patient info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{patientName}</p>
        <p className="text-xs text-gray-500 truncate">{secondaryInfo}</p>
      </div>

      {/* Date */}
      <div className="flex-shrink-0">
        <p className="text-xs text-gray-500">
          {formatMonthYear(patient.created_at)}
        </p>
      </div>
    </div>
  )
}
