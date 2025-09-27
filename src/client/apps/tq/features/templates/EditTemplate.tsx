import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Input,
  TemplateEditor,
  Alert,
  AlertDescription
} from '@client/common/ui'
import { templatesService, UpdateTemplateRequest } from '../../services/templates'
import { useTemplate } from '../../hooks/useTemplates'

interface TemplateFormData {
  title: string
  content: string
  description: string
  active: boolean
}

export const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: template, loading, error } = useTemplate(id!)

  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    content: '',
    description: '',
    active: true
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form data when template loads
  useEffect(() => {
    if (template) {
      const initialData = {
        title: template.title,
        content: template.content,
        description: template.description || '',
        active: template.active
      }
      setFormData(initialData)
    }
  }, [template])

  // Track changes
  useEffect(() => {
    if (template) {
      const hasChanged =
        formData.title !== template.title ||
        formData.content !== template.content ||
        formData.description !== (template.description || '') ||
        formData.active !== template.active

      setHasChanges(hasChanged)
    }
  }, [formData, template])

  const handleInputChange = (field: keyof TemplateFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }))

    // Clear validation error when user starts typing
    if (validationErrors.content) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.content
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long'
    }

    if (!formData.content.trim() || formData.content.trim() === '<p></p>') {
      errors.content = 'Template content is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !id) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const requestData: UpdateTemplateRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        active: formData.active
      }

      await templatesService.update(id, requestData)
      navigate('/templates')
    } catch (error) {
      console.error('Error updating template:', error)
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update template. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/templates')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
            <p className="text-gray-600">Loading template...</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Template not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          <p className="text-gray-600">
            Editing: {template.title}
          </p>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <Alert>
          <AlertDescription>
            You have unsaved changes. Make sure to save before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={handleInputChange('title')}
                placeholder="Enter template title"
                error={validationErrors.title}
                disabled={isSubmitting}
              />
              {validationErrors.title && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Optional description to help identify this template"
                disabled={isSubmitting}
              />
            </div>

            {/* Template Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Content *
              </label>
              <TemplateEditor
                content={formData.content}
                onChange={handleContentChange}
                placeholder="Create your template using [placeholders], $variables$, and (instructions)..."
                readonly={isSubmitting}
              />
              {validationErrors.content && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.content}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Use [placeholders] for information to be filled from dialogue,
                $variables$ for system data, and (instructions) to guide the AI.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                disabled={isSubmitting}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Template is active and available for use
              </label>
            </div>

            {/* Template Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Template Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Usage Count:</span>
                  <span className="ml-2 font-medium">{template.usageCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-medium">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!formData.title.trim() || !formData.content.trim() || !hasChanges}
              >
                {hasChanges ? 'Save Changes' : 'No Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}