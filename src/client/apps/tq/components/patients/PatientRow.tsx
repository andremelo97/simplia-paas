import React, { useState } from 'react'
import { Edit, Copy, Trash2 } from 'lucide-react'
import { Button } from '@client/common/ui'
import { Patient } from '../../services/patients'
import { formatPatientName } from '../../hooks/usePatients'

interface PatientRowProps {
  patient: Patient
  onEdit?: (patient: Patient) => void
  onDuplicate?: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
}

export const PatientRow: React.FC<PatientRowProps> = ({
  patient,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleEdit = () => {
    onEdit?.(patient)
  }

  const handleDuplicate = () => {
    onDuplicate?.(patient)
  }

  const handleDelete = () => {
    onDelete?.(patient)
  }

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
            {new Date(patient.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
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

      {/* Actions - visible on hover */}
      <div className={`flex items-center gap-1 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          aria-label={`Edit ${formatPatientName(patient)}`}
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          aria-label={`Duplicate ${formatPatientName(patient)}`}
        >
          <Copy className="w-4 h-4 text-gray-600" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-8 w-8 p-0 hover:bg-red-100"
          aria-label={`Delete ${formatPatientName(patient)}`}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  )
}