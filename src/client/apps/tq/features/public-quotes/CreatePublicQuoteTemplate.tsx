import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea, Checkbox } from '@client/common/ui'
import { publicQuotesService, CreateTemplateRequest } from '../../services/publicQuotes'

export const CreatePublicQuoteTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<CreateTemplateRequest>({
    name: 'Public Quote Template',
    description: 'Template layout for public quotes',
    content: {},
    isDefault: false,
    active: true
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const handleInputChange = (field: keyof CreateTemplateRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCheckboxChange = (field: 'isDefault' | 'active') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Template name is required'
    } else if (formData.name.length < 2) {
      errors.name = 'Template name must be at least 2 characters'
    } else if (formData.name.length > 255) {
      errors.name = 'Template name must be less than 255 characters'
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
      console.log('🔍 [CreateTemplate] Sending data:', formData)
      await publicQuotesService.createTemplate(formData)
      console.log('✅ [CreateTemplate] Template created successfully')

      // Navigate back to templates list
      navigate('/public-quotes/templates')

    } catch (error: any) {
      console.error('❌ [CreateTemplate] Failed to create template:', error)

      let errorMessage = 'Failed to create template. Please try again.'

      if (error.message?.includes('Maximum of 3 templates')) {
        errorMessage = 'Maximum of 3 templates allowed per tenant.'
      } else if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to create templates.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [CreateTemplate] Error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/public-quotes/templates')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <p className="text-gray-600 mt-1">
          Create a new template for public quote layouts
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Template Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Template Information</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div>
                <Input
                  label="Template Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={validationErrors.name}
                  placeholder={t('public_quotes.placeholders.template_name')}
                  helperText="Template name (required)"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={validationErrors.description}
                  placeholder={t('public_quotes.placeholders.template_description')}
                  helperText="Additional details about the template (optional)"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-4">
                <Checkbox
                  label="Set as Default"
                  description="Use this template by default when creating public quotes"
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange('isDefault')}
                  disabled={isSubmitting}
                />

                <Checkbox
                  label="Active"
                  description="When checked, this template will be available for use"
                  checked={formData.active}
                  onChange={handleCheckboxChange('active')}
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
  )
}
