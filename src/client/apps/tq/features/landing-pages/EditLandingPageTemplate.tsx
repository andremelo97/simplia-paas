import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea, Checkbox, ConfirmDialog } from '@client/common/ui'
import { landingPagesService, UpdateTemplateRequest } from '../../services/landingPages'
import { useAuthStore } from '../../shared/store'

export const EditLandingPageTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

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
      const template = await landingPagesService.getTemplate(id)

      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        isDefault: template.isDefault,
        active: template.active
      })
    } catch (error) {
      // Failed to load data
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplate = async () => {
    if (!id) return
    try {
      const template = await landingPagesService.getTemplate(id)
      setFormData({
        name: template.name,
        description: template.description || '',
        content: template.content,
        isDefault: template.isDefault,
        active: template.active
      })
    } catch (error) {
      // Failed to load template
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
      errors.name = t('landing_pages.validation.name_required')
    } else if (formData.name.length < 2) {
      errors.name = t('landing_pages.validation.name_min')
    } else if (formData.name.length > 255) {
      errors.name = t('landing_pages.validation.name_max')
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
      await landingPagesService.updateTemplate(id, formData)

      // Stay on edit page - don't navigate
      loadTemplate()

    } catch (error: any) {
      // Error is handled by HTTP interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/landing-pages/templates')
  }

  const handleDesignLayout = () => {
    if (id) {
      navigate(`/landing-pages/templates/${id}/design`)
    }
  }

  const handleDuplicate = async () => {
    if (!id) return

    setIsDuplicating(true)

    try {
      const template = await landingPagesService.getTemplate(id)

      const duplicateData = {
        name: t('landing_pages.duplicate_name', { name: template.name }),
        description: template.description,
        content: template.content,
        isDefault: false, // Duplicate is never default
        active: false // Duplicate starts inactive
      }

      const newTemplate = await landingPagesService.createTemplate(duplicateData)

      // Navigate to the new duplicated template
      navigate(`/landing-pages/templates/${newTemplate.id}/edit`)
    } catch (error) {
      // Failed to duplicate template
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)

    try {
      await landingPagesService.deleteTemplate(id)
      // Feedback is handled automatically by HTTP interceptor
      // Navigate back to templates list
      navigate('/landing-pages/templates')
    } catch (error) {
      // Error feedback is handled by HTTP interceptor
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('landing_pages.loading_template')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('landing_pages.edit_template')}</h1>
          <p className="text-gray-600 mt-1">
            {t('landing_pages.edit_template_subtitle')}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="tertiary"
              onClick={handleDesignLayout}
              disabled={isSubmitting || isDuplicating || isDeleting}
            >
              {t('landing_pages.design_layout')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDuplicate}
              isLoading={isDuplicating}
              disabled={isSubmitting || isDuplicating || isDeleting}
            >
              {isDuplicating ? t('landing_pages.duplicating') : t('landing_pages.duplicate')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting || isDuplicating || isDeleting}
            >
              {t('common.delete')}
            </Button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block" />
            <Button
              type="submit"
              form="editLandingPageTemplateForm"
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
            >
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </div>

      <form id="editLandingPageTemplateForm" onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Template Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('landing_pages.template_information')}</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div>
                <Input
                  label={t('landing_pages.template_name')}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={validationErrors.name}
                  placeholder={t('landing_pages.placeholders.template_name')}
                  helperText={t('landing_pages.helper.template_name')}
                  required
                  disabled={!canEdit || isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  label={t('landing_pages.description')}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={validationErrors.description}
                  placeholder={t('landing_pages.placeholders.template_description')}
                  helperText={t('landing_pages.helper.description')}
                  rows={3}
                  disabled={!canEdit || isSubmitting}
                />
              </div>

              <div className="space-y-4">
                <Checkbox
                  label={t('landing_pages.set_as_default')}
                  description={t('landing_pages.set_as_default_description')}
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange('isDefault')}
                  disabled={!canEdit || isSubmitting}
                />

                <Checkbox
                  label={t('common.active')}
                  description={t('landing_pages.active_description')}
                  checked={formData.active}
                  onChange={handleCheckboxChange('active')}
                  disabled={!canEdit || isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('landing_pages.delete_template')}
        description={t('landing_pages.delete_template_description', { name: formData.name })}
        confirmText={t('landing_pages.delete_template_confirm')}
        variant="delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
