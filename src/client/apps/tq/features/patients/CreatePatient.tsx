import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardContent, Button, Input, Textarea } from '@client/common/ui'
import { patientsService } from '../../services/patients'

interface PatientFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  notes: string
}

export const CreatePatient: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const handleInputChange = (field: keyof PatientFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))

    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Validate patient basic info
    if (!formData.first_name.trim()) {
      errors.first_name = t('patients.validation.first_name_required')
    } else if (formData.first_name.length < 2) {
      errors.first_name = t('patients.validation.first_name_min')
    } else if (formData.first_name.length > 50) {
      errors.first_name = t('patients.validation.first_name_max')
    }

    if (formData.last_name && formData.last_name.length > 50) {
      errors.last_name = t('patients.validation.last_name_max')
    }

    // Email validation (optional field)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('patients.validation.email_invalid')
    }

    // Phone validation (optional field)
    if (formData.phone && formData.phone.length > 20) {
      errors.phone = t('patients.validation.phone_max')
    }

    // Notes validation (optional field)
    if (formData.notes && formData.notes.length > 500) {
      errors.notes = t('patients.validation.notes_max')
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
      console.log('👤 [CreatePatient] Submitting patient creation:', {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined
      })

      // Create patient with proper API payload
      const patientData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined
      }

      await patientsService.createPatient(patientData)
      console.log('✅ [CreatePatient] Patient created successfully')

      // Success feedback is now handled automatically by the HTTP interceptor
      // based on the meta.code from the backend response

      // Navigate immediately - toast will show on the patients list page
      navigate('/patients')

    } catch (error: any) {
      console.error('❌ [CreatePatient] Failed to create patient:', error)

      // Map backend errors to user-friendly messages
      let errorMessage = 'Failed to create patient. Please try again.'

      // Handle specific error cases based on backend responses
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        errorMessage = 'A patient with this email already exists. Please use a different email.'
      } else if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 409) {
        errorMessage = 'Patient already exists. Please check the information.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to create patients.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [CreatePatient] Create error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/patients')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('patients.create')}</h1>
        <p className="text-gray-600 mt-1">
          {t('patients.create_subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Patient Information */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('patients.patient_information')}</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('patients.first_name')}
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                  error={validationErrors.first_name}
                  placeholder={t('patients.placeholders.first_name')}
                  helperText={t('patients.helper.first_name')}
                  required
                  disabled={isSubmitting}
                />

                <Input
                  label={t('patients.last_name')}
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                  error={validationErrors.last_name}
                  placeholder={t('patients.placeholders.last_name')}
                  helperText={t('patients.helper.last_name')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('patients.email')}
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={validationErrors.email}
                  placeholder={t('patients.placeholders.email')}
                  helperText={t('patients.helper.email')}
                  disabled={isSubmitting}
                />

                <Input
                  label={t('patients.phone')}
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  error={validationErrors.phone}
                  placeholder={t('patients.placeholders.phone')}
                  helperText={t('patients.helper.phone')}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  label={t('common.notes')}
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  error={validationErrors.notes}
                  placeholder={t('patients.placeholders.notes')}
                  helperText={t('patients.helper.notes')}
                  rows={4}
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
            {isSubmitting ? t('patients.creating_patient') : t('patients.create')}
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