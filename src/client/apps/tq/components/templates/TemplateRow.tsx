import React, { useState } from 'react'
import { Edit, Trash2, Eye, Copy, MoreHorizontal } from 'lucide-react'
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Modal
} from '@client/common/ui'
import { Template } from '../../services/templates'
import { templatesService } from '../../services/templates'

interface TemplateRowProps {
  template: Template
  onEdit: (template: Template) => void
  onDelete: () => void
  className?: string
}

export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  onEdit,
  onDelete,
  className
}) => {
  const [showPreview, setShowPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await templatesService.delete(template.id)
      onDelete()
    } catch (error) {
      console.error('Error deleting template:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(template.content)
      // Could show a toast here
    } catch (error) {
      console.error('Error copying template:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    const stripped = content.replace(/<[^>]*>/g, '') // Remove HTML tags
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + '...'
  }

  return (
    <>
      <div className={`border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {template.title}
              </h3>
              <Badge variant={template.active ? "default" : "secondary"}>
                {template.active ? "Active" : "Inactive"}
              </Badge>
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {template.description}
              </p>
            )}

            <p className="text-sm text-gray-500 mb-3">
              {truncateContent(template.content)}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Used {template.usageCount} times</span>
              <span>Created {formatDate(template.createdAt)}</span>
              <span>Updated {formatDate(template.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyTemplate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title={`Preview: ${template.title}`}
        >
          <div className="space-y-4">
            {template.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{template.description}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Template Content</h4>
              <div
                className="border border-gray-200 rounded-md p-4 bg-gray-50 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: template.content }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Usage Count: {template.usageCount}</span>
              <span>Status: {template.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Template"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete "{template.title}"? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={isDeleting}
              >
                Delete Template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}