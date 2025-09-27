import React from 'react'
import { FileType } from 'lucide-react'

interface TemplatesEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const TemplatesEmpty: React.FC<TemplatesEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileType className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? 'No templates found' : 'No templates yet'}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? `No templates match "${query}". Try adjusting your search.`
          : 'Get started by creating your first clinical documentation template.'
        }
      </p>
    </div>
  )
}