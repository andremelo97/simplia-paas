import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import { Button } from '@client/common/ui'

interface ItemsEmptyProps {
  hasQuery?: boolean
  query?: string
}

export const ItemsEmpty: React.FC<ItemsEmptyProps> = ({
  hasQuery = false,
  query = ''
}) => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Package className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasQuery ? t('items.empty.not_found') : t('items.empty.no_items')}
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        {hasQuery
          ? t('items.empty.no_match', { query })
          : t('items.empty.get_started')
        }
      </p>

      {!hasQuery && (
        <Button variant="secondary" onClick={() => navigate('/documents/items/create')} className="mt-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('items.empty.create_first')}
        </Button>
      )}
    </div>
  )
}