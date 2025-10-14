import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'

export const TemplatesEmpty: React.FC = () => {
  const { t } = useTranslation('tq')

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('public_quotes.templates_empty.no_templates')}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {t('public_quotes.templates_empty.get_started')}
      </p>
    </div>
  )
}
