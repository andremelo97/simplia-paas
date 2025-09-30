import React from 'react'
import { FileText } from 'lucide-react'

interface ClinicalReportsEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const ClinicalReportsEmpty: React.FC<ClinicalReportsEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? 'No clinical reports found' : 'No clinical reports yet'}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? `No clinical reports match "${query}". Try adjusting your search.`
          : 'Create a clinical report from a session to see it appear here.'
        }
      </p>
    </div>
  )
}
