import React from 'react'
import { FileText } from 'lucide-react'

export const TemplatesEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No templates yet
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        Create your first template to customize public quote layouts
      </p>
    </div>
  )
}
