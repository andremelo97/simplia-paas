import React, { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Badge, Tooltip } from '@client/common/ui'
import { Item } from '../../services/items'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useCurrencyFormatter } from '@client/common/hooks/useCurrencyFormatter'
import { useAuthStore } from '../../shared/store'

interface ItemRowProps {
  item: Item
  onEdit?: (item: Item) => void
  onDelete?: (item: Item) => void
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation('tq')
  const [isHovered, setIsHovered] = useState(false)
  const { formatShortDate } = useDateFormatter()
  const { formatCurrency } = useCurrencyFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const handleEdit = () => {
    onEdit?.(item)
  }

  const handleDelete = () => {
    onDelete?.(item)
  }

  return (
    <div
      className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Created Date */}
        <div className="w-24">
          <span className="text-sm text-gray-600">
            {formatShortDate(item.createdAt)}
          </span>
        </div>

        {/* Item Name */}
        <div className="min-w-0 flex-1">
          <span className={`font-medium truncate ${item.active ? 'text-gray-900' : 'text-gray-500'}`}>
            {item.name}
          </span>
        </div>

        {/* Description */}
        <div className="min-w-0 flex-1">
          <span className={`text-sm truncate ${item.active ? 'text-gray-600' : 'text-gray-400'}`}>
            {item.description || t('quote_items.no_description')}
          </span>
        </div>

        {/* Base Price */}
        <div className="min-w-0 flex-1">
          <span className={`text-sm ${item.active ? 'text-gray-600' : 'text-gray-400'}`}>
            {formatCurrency(item.basePrice)}
          </span>
        </div>

        {/* Status */}
        <div className="min-w-0 flex-1">
          <Badge variant={item.active ? 'success' : 'default'}>
            {item.active ? t('common.active') : t('common.inactive')}
          </Badge>
        </div>
      </div>

      {/* Actions - visible on hover */}
      <div
        className={`flex items-center gap-1 w-24 justify-end transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Tooltip content={t('common:edit')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label={t('common:edit')}
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
        </Tooltip>

        {canEdit && (
          <Tooltip content={t('common:delete')}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-100"
              aria-label={t('common:delete')}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
