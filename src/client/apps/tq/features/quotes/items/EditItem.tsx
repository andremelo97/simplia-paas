import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea, PriceInput, Checkbox } from '@client/common/ui'
import { itemsService, CreateItemRequest, Item } from '../../../services/items'
import { formatDate } from '@client/common/utils/dateUtils'

export const EditItem: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    description: '',
    basePrice: 0,
    active: true
  })
  const [originalItem, setOriginalItem] = useState<Item | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    if (id) {
      loadItem(id)
    }
  }, [id])

  const loadItem = async (itemId: string) => {
    try {
      setIsLoading(true)
      const item = await itemsService.getById(itemId)
      setOriginalItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        basePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
        active: item.active
      })
    } catch (error) {
      console.error('❌ [EditItem] Failed to load item:', error)
      navigate('/quotes/items')
    } finally {
      setIsLoading(false)
    }
  }

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

    if (!validateForm() || !id) {
      return
    }

    setIsSubmitting(true)

    try {
      console.log('🔍 [EditItem] Sending data:', formData)
      await itemsService.update(id, formData)
      console.log('✅ [EditItem] Item updated successfully')

      // Success feedback is now handled automatically by the HTTP interceptor
      // based on the meta.code from the backend response

      // Navigate immediately - toast will show on the items list page
      navigate('/quotes/items')

    } catch (error: any) {
      console.error('❌ [EditItem] Failed to update item:', error)

      // Map backend errors to user-friendly messages
      let errorMessage = t('quote_items.errors.update_failed')

      // Handle specific error cases based on backend responses
      if (error.message?.includes('Validation Error')) {
        errorMessage = t('quote_items.errors.check_input')
      } else if (error.status === 409) {
        errorMessage = t('quote_items.errors.already_exists')
      } else if (error.status === 403) {
        errorMessage = t('quote_items.errors.no_permission')
      } else if (error.status === 401) {
        errorMessage = t('quote_items.errors.session_expired')
      } else if (error.status >= 500) {
        errorMessage = t('quote_items.errors.server_error')
      }

      console.error('❌ [EditItem] Update error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/quotes/items')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quote_items.edit')}</h1>
          <p className="text-gray-600 mt-1">{t('quote_items.loading_item')}</p>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!originalItem) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quote_items.edit')}</h1>
          <p className="text-red-600 mt-1">{t('quote_items.not_found')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('quote_items.edit')}</h1>
        <p className="text-gray-600 mt-1">
          {t('quote_items.edit_subtitle', { name: originalItem.name })}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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

          {/* Record Information */}
          {originalItem && (
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('quote_items.record_information')}</h2>
              </CardHeader>

              <CardContent className="space-y-6 px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t('common.created_at')}
                    value={formatDate(originalItem.createdAt)}
                    disabled
                    helperText={t('quote_items.helper.created_at')}
                  />

                  <Input
                    label={t('common.updated_at')}
                    value={formatDate(originalItem.updatedAt)}
                    disabled
                    helperText={t('quote_items.helper.updated_at')}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('quote_items.updating_item') : t('quote_items.update')}
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