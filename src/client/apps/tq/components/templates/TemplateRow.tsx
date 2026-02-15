import React from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Trash2 } from 'lucide-react'
import { Button, Tooltip } from '@client/common/ui'
import { Template } from '../../services/templates'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useAuthStore } from '../../shared/store'

interface TemplateRowProps {
  template: Template
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
}

export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const handleEdit = () => {
    onEdit(template)
  }

  const handleDelete = () => {
    onDelete(template)
  }

  const truncateContent = (content: string, maxLength: number = 80) => {
    const stripped = content.replace(/<[^>]*>/g, '') // Remove HTML tags
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + '...'
  }

  return (
    <div
      className="flex items-center gap-6 py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onDoubleClick={() => onEdit(template)}
    >
      {/* Created At */}
      <div className="w-24">
        <span className="text-sm text-gray-600">
          {formatShortDate(template.createdAt)}
        </span>
      </div>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-900 truncate">
          {template.title}
        </span>
      </div>

      {/* Description or Content Preview */}
      <div className="min-w-0 flex-1">
        <span className="text-gray-600 truncate">
          {template.description || truncateContent(template.content)}
        </span>
      </div>

      {/* Usage Count */}
      <div className="w-20">
        <span className="text-gray-600 text-sm">
          {template.usageCount}
        </span>
      </div>

      {/* Actions */}
      <div className="w-24 flex items-center justify-end gap-1">
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
