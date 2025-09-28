import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { templatesService, CreateTemplateRequest } from '../../services/templates'

interface TemplateFormData {
  title: string
  content: string
  description: string
  active: boolean
}

const INITIAL_FORM_DATA: TemplateFormData = {
  title: '',
  content: '',
  description: '',
  active: true
}

export const CreateTemplate: React.FC = () => {
  const [formData, setFormData] = useState<TemplateFormData>(INITIAL_FORM_DATA)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVariables, setShowVariables] = useState(false)

  const navigate = useNavigate()

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

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const requestData: CreateTemplateRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        active: formData.active
      }

      await templatesService.create(requestData)
      navigate('/templates')
    } catch (error: any) {
      console.error('❌ [CreateTemplate] Failed to create template:', error)

      // Error handling is now managed by HTTP interceptor
      let errorMessage = 'Failed to create template. Please try again.'

      if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 409) {
        errorMessage = 'Template already exists. Please check the information.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to create templates.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [CreateTemplate] Create error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/templates')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <p className="text-gray-600 mt-1">
          Create a new clinical documentation template
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
                {isSubmitting ? 'Creating Template...' : 'Create Template'}
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
                      <div><code className="font-mono text-green-700">$date.now$</code> - Current date</div>
                      <div><code className="font-mono text-green-700">$session.created_at$</code> - Session creation date</div>
                      <div><code className="font-mono text-green-700">$me.first_name$</code> - Your first name</div>
                      <div><code className="font-mono text-green-700">$me.last_name$</code> - Your last name</div>
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
{`Dear $patient.first_name$ $patient.last_name$, your appointment on $session.created_at$ was [summarize findings].

Dr. $me.first_name$ $me.last_name$ from $me.clinic$ recommends [treatment plan]. (Only include if mentioned in transcript)

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