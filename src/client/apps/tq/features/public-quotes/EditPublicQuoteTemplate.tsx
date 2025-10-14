import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea, Checkbox, ConfirmDialog } from '@client/common/ui'
import { publicQuotesService, UpdateTemplateRequest } from '../../services/publicQuotes'

export const EditPublicQuoteTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<UpdateTemplateRequest>({
    name: '',
    description: '',
    content: {},
    isDefault: false,
    active: true
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const template = await publicQuotesService.getTemplate(id)

      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        isDefault: template.isDefault,
        active: template.active
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplate = async () => {
    if (!id) return
    try {
      const template = await publicQuotesService.getTemplate(id)
      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        isDefault: template.isDefault,
        active: template.active
      })
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const handleInputChange = (field: keyof UpdateTemplateRequest) => (
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

    if (!formData.name?.trim()) {
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

    if (!validateForm() || !id) {
      return
    }

    setIsSubmitting(true)

    try {
      console.log('🔍 [EditTemplate] Sending data:', formData)
      await publicQuotesService.updateTemplate(id, formData)
      console.log('✅ [EditTemplate] Template updated successfully')

      // Stay on edit page - don't navigate
      loadTemplate()

    } catch (error: any) {
      console.error('❌ [EditTemplate] Failed to update template:', error)

      let errorMessage = 'Failed to update template. Please try again.'

      if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to update templates.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [EditTemplate] Error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/public-quotes/templates')
  }

  const handleDesignLayout = () => {
    if (id) {
      navigate(`/public-quotes/templates/${id}/design`)
    }
  }

  const handleDuplicate = async () => {
    if (!id) return

    setIsDuplicating(true)

    try {
      const template = await publicQuotesService.getTemplate(id)

      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        content: template.content,
        isDefault: false, // Duplicate is never default
        active: template.active
      }

      const newTemplate = await publicQuotesService.createTemplate(duplicateData)

      // Navigate to the new duplicated template
      navigate(`/public-quotes/templates/${newTemplate.id}/edit`)
    } catch (error) {
      console.error('Failed to duplicate template:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)

    try {
      await publicQuotesService.deleteTemplate(id)
      // Feedback is handled automatically by HTTP interceptor
      // Navigate back to templates list
      navigate('/public-quotes/templates')
    } catch (error) {
      console.error('Failed to delete template:', error)
      // Error feedback is also handled by HTTP interceptor
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('public_quotes.loading_template')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public_quotes.edit_template')}</h1>
          <p className="text-gray-600 mt-1">
            {t('public_quotes.edit_template_subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="tertiary"
            onClick={handleDesignLayout}
            disabled={isSubmitting || isDuplicating || isDeleting}
          >
            {t('public_quotes.design_layout')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleDuplicate}
            isLoading={isDuplicating}
            disabled={isSubmitting || isDuplicating || isDeleting}
          >
            {isDuplicating ? t('public_quotes.duplicating') : t('public_quotes.duplicate')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting || isDuplicating || isDeleting}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Template Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('public_quotes.template_information')}</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div>
                <Input
                  label={t('public_quotes.template_name')}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={validationErrors.name}
                  placeholder={t('public_quotes.placeholders.template_name')}
                  helperText={t('public_quotes.helper.template_name')}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  label={t('public_quotes.description')}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={validationErrors.description}
                  placeholder={t('public_quotes.placeholders.template_description')}
                  helperText={t('public_quotes.helper.description')}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-4">
                <Checkbox
                  label={t('public_quotes.set_as_default')}
                  description={t('public_quotes.set_as_default_description')}
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange('isDefault')}
                  disabled={isSubmitting}
                />

                <Checkbox
                  label={t('common.active')}
                  description={t('public_quotes.active_description')}
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
            disabled={isSubmitting || isDuplicating}
          >
            {isSubmitting ? t('common.saving') : t('common.save_changes')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting || isDuplicating}
            style={{ height: '32px', minHeight: '32px' }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('public_quotes.delete_template')}
        description={t('public_quotes.delete_template_description', { name: formData.name })}
        confirmText={t('public_quotes.delete_template_confirm')}
        variant="delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
