import React from 'react'
import { Users } from 'lucide-react'

interface PatientsEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const PatientsEmpty: React.FC<PatientsEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? 'No patients found' : 'No patients yet'}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? `No patients match "${query}". Try adjusting your search.`
          : 'Get started by adding your first patient to begin managing transcription sessions.'
        }
      </p>
    </div>
  )
}