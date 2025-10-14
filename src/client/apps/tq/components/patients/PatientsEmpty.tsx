import React from 'react'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'

interface PatientsEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const PatientsEmpty: React.FC<PatientsEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  const { t } = useTranslation('tq')

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? t('patients.empty.not_found') : t('patients.empty.no_patients')}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? t('patients.empty.no_match', { query })
          : t('patients.empty.get_started')
        }
      </p>
    </div>
  )
}