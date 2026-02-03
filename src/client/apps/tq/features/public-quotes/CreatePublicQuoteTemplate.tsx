import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea, Checkbox } from '@client/common/ui'
import { publicQuotesService, CreateTemplateRequest } from '../../services/publicQuotes'

export const CreatePublicQuoteTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const defaultValues = useMemo(() => ({
    name: t('public_quotes.defaults.template_name'),
    description: t('public_quotes.defaults.template_description'),
    content: {},
    isDefault: false,
    active: false
  }), [t])

  const defaultRef = useRef(defaultValues)

  const [formData, setFormData] = useState<CreateTemplateRequest>(defaultValues)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    setFormData(prev => {
      const prevDefaults = defaultRef.current
      const shouldSyncName = prev.name === prevDefaults.name
      const shouldSyncDescription = prev.description === prevDefaults.description

      if (!shouldSyncName && !shouldSyncDescription) {
        defaultRef.current = defaultValues
        return prev
      }

      const updated = {
        ...prev,
        name: shouldSyncName ? defaultValues.name : prev.name,
        description: shouldSyncDescription ? defaultValues.description : prev.description
      }

      defaultRef.current = defaultValues
      return updated
    })
  }, [defaultValues])

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
      errors.name = t('public_quotes.validation.name_required')
    } else if (formData.name.length < 2) {
      errors.name = t('public_quotes.validation.name_min')
    } else if (formData.name.length > 255) {
      errors.name = t('public_quotes.validation.name_max')
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
      await publicQuotesService.createTemplate(formData)

      // Navigate back to templates list
      navigate('/public-quotes/templates')

    } catch (error: any) {
      // Error is handled by HTTP interceptor
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
        <h1 className="text-2xl font-bold text-gray-900">{t('public_quotes.pages.create_template')}</h1>
        <p className="text-gray-600 mt-1">
          {t('public_quotes.create_subtitle')}
        </p>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? t('public_quotes.creating_template') : t('public_quotes.pages.create_template')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ height: '32px', minHeight: '32px' }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
