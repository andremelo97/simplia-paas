import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Receipt, Mic } from 'lucide-react'
import { Button } from '@client/common/ui'

interface QuotesEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const QuotesEmpty: React.FC<QuotesEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

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

      {!hasQuery && (
        <Button variant="secondary" onClick={() => navigate('/new-session')} className="mt-4 flex items-center gap-2">
          <Mic className="w-4 h-4" />
          {t('quotes.empty.create_first')}
        </Button>
      )}
    </div>
  )
}