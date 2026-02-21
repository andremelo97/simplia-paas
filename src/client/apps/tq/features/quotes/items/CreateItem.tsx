import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea, PriceInput, Checkbox } from '@client/common/ui'
import { itemsService, CreateItemRequest } from '../../../services/items'

export const CreateItem: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    description: '',
    basePrice: 0,
    active: true
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const handleInputChange = (field: keyof CreateItemRequest) => (
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

  const handlePriceChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      basePrice: value
    }))

    if (validationErrors.basePrice) {
      setValidationErrors(prev => ({ ...prev, basePrice: '' }))
    }
  }

  const handleActiveChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      active: checked
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = t('quote_items.validation.name_required')
    } else if (formData.name.length < 2) {
      errors.name = t('quote_items.validation.name_min')
    } else if (formData.name.length > 100) {
      errors.name = t('quote_items.validation.name_max')
    }

    if (formData.basePrice <= 0) {
      errors.basePrice = t('quote_items.validation.price_greater_than_zero')
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
      await itemsService.create(formData)

      // Success feedback is handled automatically by the HTTP interceptor

      // Navigate immediately - toast will show on the items list page
      navigate('/documents/items')

    } catch (error: any) {
      // Error is handled by HTTP interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/documents/items')
  }

  return (
    <div className="space-y-6">
      <div className="sm:sticky sm:top-0 sm:z-30 sm:bg-white sm:pb-4 sm:shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quote_items.pages.create_title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('quote_items.pages.create_subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            type="submit"
            form="createItemForm"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('quote_items.creating_item') : t('quote_items.pages.create_item')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>

      <form id="createItemForm" onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Item Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('quote_items.item_information')}</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('quote_items.name')}
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={validationErrors.name}
                  placeholder={t('quote_items.placeholders.name')}
                  helperText={t('quote_items.helper.name')}
                  required
                  disabled={isSubmitting}
                />

                <PriceInput
                  label={t('quote_items.base_price')}
                  value={formData.basePrice}
                  onChange={handlePriceChange}
                  error={validationErrors.basePrice}
                  helperText={t('quote_items.helper.base_price')}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  label={t('quote_items.description')}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={validationErrors.description}
                  placeholder={t('quote_items.placeholders.description')}
                  helperText={t('quote_items.helper.description')}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Checkbox
                  label={t('common.active')}
                  description={t('quote_items.active_checkbox')}
                  checked={formData.active}
                  onChange={(e) => handleActiveChange(e.target.checked)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </form>
    </div>
  )
}
