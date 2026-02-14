import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link2 } from 'lucide-react'

export const LinksEmpty: React.FC = () => {
  const { t } = useTranslation('tq')

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Link2 className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('landing_pages.links_empty.no_links')}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {t('landing_pages.links_empty.get_started')}
      </p>
    </div>
  )
}
