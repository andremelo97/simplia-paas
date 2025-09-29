import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  TemplateEditor,
  Checkbox
} from '@client/common/ui'
import { templatesService, UpdateTemplateRequest } from '../../services/templates'

interface TemplateFormData {
  title: string
  content: string
  description: string
  active: boolean
}

export const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    content: '',
    description: '',
    active: true
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load existing template data
  useEffect(() => {
    console.log('🔍 [EditTemplate] useEffect triggered with id:', id)

    // Skip if already loaded or loading
    if (!id || (!isLoading && formData.title)) {
      console.log('🔍 [EditTemplate] Skipping useEffect - already loaded or no ID')
      return
    }

    let isCancelled = false

    const loadTemplateData = async () => {
      console.log('🔍 [EditTemplate] Starting loadTemplateData')

      try {
        if (!isCancelled) {
          setIsLoading(true)
        }

        const template = await templatesService.getById(id)

        if (!isCancelled) {
          console.log('🔍 [EditTemplate] Setting form data from template')
          // Initialize form data
          setFormData({
            title: template.title,
            content: template.content,
            description: template.description || '',
            active: template.active
          })

          setLoadError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load template')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTemplateData()

    return () => {
      isCancelled = true
    }
  }, [id])

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
    e.stopPropagation()

    console.log('🔍 [EditTemplate] handleSubmit called by:', e.target, 'Type:', e.type, 'nativeEvent:', e.nativeEvent)

    // Check if this is triggered by the dark mode toggle
    if (e.target && (e.target as any).className?.includes('theme') ||
        (e.target as any).getAttribute?.('aria-label')?.includes('theme') ||
        (e.target as any).getAttribute?.('aria-label')?.includes('dark')) {
      console.log('🚫 [EditTemplate] Submit triggered by theme toggle, ignoring')
      return
    }

    if (!validateForm() || !id) {
      console.log('🔍 [EditTemplate] Validation failed or no ID')
      return
    }

    if (isSubmitting) {
      console.log('🔍 [EditTemplate] Already submitting, ignoring')
      return
    }

    setIsSubmitting(true)

    try {
      const requestData: UpdateTemplateRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        active: formData.active
      }

      console.log('🔍 [EditTemplate] Submitting update request')
      await templatesService.update(id, requestData)
      console.log('✅ [EditTemplate] Update successful, navigating')
      navigate('/templates')
    } catch (error: any) {
      console.error('❌ [EditTemplate] Update failed:', error)

      // Error handling is now managed by HTTP interceptor
      let errorMessage = 'Failed to update template. Please try again.'

      if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 409) {
        errorMessage = 'Template already exists. Please check the information.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to update templates.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [EditTemplate] Update error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    console.log('🔍 [EditTemplate] handleCancel called')
    navigate('/templates')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          <p className="text-gray-600 mt-1">
            Loading template...
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
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
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
          <p className="text-gray-600 mt-1">
            {loadError}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-gray-600 mt-1">
          Editing: {formData.title || 'Template'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Form - 60% */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Template Information */}
              <Card>
                <CardHeader className="p-6 pb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Template Information</h2>
                </CardHeader>

                <CardContent className="space-y-6 px-6 pb-6">
                  <div className="space-y-6">
                    <Input
                      label="Title"
                      value={formData.title}
                      onChange={handleInputChange('title')}
                      error={validationErrors.title}
                      placeholder="e.g., Dental Consultation Summary"
                      helperText="Descriptive name for this template (required)"
                      required
                      disabled={isSubmitting}
                    />

                    <Input
                      label="Description"
                      value={formData.description}
                      onChange={handleInputChange('description')}
                      placeholder="Optional description to help identify this template"
                      helperText="Brief description of template purpose (optional)"
                      disabled={isSubmitting}
                    />
                  </div>

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
                  </div>

                  <div>
                    <Checkbox
                      label="Template is active and available for use"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      disabled={isSubmitting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-200">
              <Button
                type="submit"
                variant="default"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating Template...' : 'Update Template'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
                style={{ height: '32px', minHeight: '32px' }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Template Creation Guide - 40% */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Template Creation Guide</h2>
              <p className="text-sm text-gray-600 mt-1">
                How to create dynamic templates for clinical documentation
              </p>
            </CardHeader>

            <CardContent className="px-6 pb-6 space-y-6">
              {/* Placeholders */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Placeholders:</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <code className="text-sm text-blue-800 font-mono">[placeholder]</code>
                </div>
                <p className="text-xs text-gray-600">
                  Wrapped in square brackets. These will be filled with information from the session dialogue, clinical notes, or contextual notes.
                </p>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Instructions:</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  <code className="text-sm text-amber-800 font-mono">(instruction)</code>
                </div>
                <p className="text-xs text-gray-600">
                  Wrapped in round brackets. These guide the AI on how to behave when information is missing. Instructions will not appear in the final output.
                </p>
              </div>

              {/* System Variables */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">System Variables:</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <code className="text-sm text-green-800 font-mono">$variable$</code>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Wrapped in double dollar signs. These are filled with database values when the quote/report is created.
                </p>

                <button
                  type="button"
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  {showVariables ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  Click here to see the available variables
                </button>

                {showVariables && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="space-y-2 text-xs">
                      <div><code className="font-mono text-green-700">$patient.first_name$</code> - Patient's first name</div>
                      <div><code className="font-mono text-green-700">$patient.last_name$</code> - Patient's last name</div>
                      <div><code className="font-mono text-green-700">$patient.fullName$</code> - Patient's full name (first + last)</div>
                      <div><code className="font-mono text-green-700">$date.now$</code> - Current date</div>
                      <div><code className="font-mono text-green-700">$session.created_at$</code> - Session creation date</div>
                      <div><code className="font-mono text-green-700">$me.first_name$</code> - Your first name</div>
                      <div><code className="font-mono text-green-700">$me.last_name$</code> - Your last name</div>
                      <div><code className="font-mono text-green-700">$me.fullName$</code> - Your full name (first + last)</div>
                      <div><code className="font-mono text-green-700">$me.clinic$</code> - Your clinic name</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Example */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Example:</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <code className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
{`Dear $patient.fullName$, your appointment on $session.created_at$ was [summarize findings].

Dr. $me.fullName$ from $me.clinic$ recommends [treatment plan]. (Only include if mentioned in transcript)

Next appointment: [next appointment details]`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}