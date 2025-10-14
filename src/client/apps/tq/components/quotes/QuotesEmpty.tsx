import React from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'

interface QuotesEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const QuotesEmpty: React.FC<QuotesEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  const { t } = useTranslation('tq')

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Receipt className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? t('quotes.empty.not_found') : t('quotes.empty.no_quotes')}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? t('quotes.empty.no_match', { query })
          : t('quotes.empty.get_started')
        }
      </p>
    </div>
  )
}