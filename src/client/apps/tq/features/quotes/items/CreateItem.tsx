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
      errors.name = 'Item name is required'
    } else if (formData.name.length < 2) {
      errors.name = 'Item name must be at least 2 characters'
    } else if (formData.name.length > 100) {
      errors.name = 'Item name must be less than 100 characters'
    }

    if (formData.basePrice <= 0) {
      errors.basePrice = 'Base price must be greater than 0'
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
      console.log('🔍 [CreateItem] Sending data:', formData)
      await itemsService.create(formData)
      console.log('✅ [CreateItem] Item created successfully')

      // Success feedback is now handled automatically by the HTTP interceptor
      // based on the meta.code from the backend response

      // Navigate immediately - toast will show on the items list page
      navigate('/quotes/items')

    } catch (error: any) {
      console.error('❌ [CreateItem] Failed to create item:', error)

      // Map backend errors to user-friendly messages
      let errorMessage = 'Failed to create item. Please try again.'

      // Handle specific error cases based on backend responses
      if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 409) {
        errorMessage = 'Item already exists. Please check the information.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to create items.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [CreateItem] Create error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/quotes/items')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Item</h1>
        <p className="text-gray-600 mt-1">
          Add a new service or product to your catalog
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Item Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Item Information</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Item Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={validationErrors.name}
                  placeholder={t('quote_items.placeholders.name')}
                  helperText="Service or product name (required)"
                  required
                  disabled={isSubmitting}
                />

                <PriceInput
                  label="Base Price"
                  value={formData.basePrice}
                  onChange={handlePriceChange}
                  error={validationErrors.basePrice}
                  helperText="Standard price before discounts (required)"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={validationErrors.description}
                  placeholder={t('quote_items.placeholders.description')}
                  helperText="Additional details about the item (optional)"
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Checkbox
                  label="Active"
                  description="When checked, this item will be available for use in quotes"
                  checked={formData.active}
                  onChange={(e) => handleActiveChange(e.target.checked)}
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
            {isSubmitting ? 'Creating Item...' : 'Create Item'}
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