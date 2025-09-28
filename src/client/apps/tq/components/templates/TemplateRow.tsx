import React, { useState } from 'react'
import { Edit } from 'lucide-react'
import { Button } from '@client/common/ui'
import { Template } from '../../services/templates'

interface TemplateRowProps {
  template: Template
  onEdit: (template: Template) => void
  onDelete: () => void
}

export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  onEdit,
  onDelete
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleEdit = () => {
    onEdit(template)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 80) => {
    const stripped = content.replace(/<[^>]*>/g, '') // Remove HTML tags
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + '...'
  }

  return (
    <div
      className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Created At */}
        <div className="w-24">
          <span className="text-sm text-gray-600">
            {formatDate(template.createdAt)}
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
      </div>

      {/* Actions - visible on hover */}
      <div className={`w-24 flex items-center gap-1 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          aria-label={`Edit ${template.title}`}
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </Button>
      </div>
    </div>
  )
}