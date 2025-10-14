import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Input, Textarea } from '@client/common/ui'
import { patientsService, Patient } from '../../services/patients'
import { formatDate } from '@client/common/utils/dateUtils'

interface PatientFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  notes: string
}

export const EditPatient: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [patientData, setPatientData] = useState<Patient | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // Load existing patient data
  useEffect(() => {
    const loadPatientData = async () => {
      if (!id) {
        setLoadError('Patient ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        console.log('👤 [EditPatient] Loading patient data for ID:', id)
        const patient = await patientsService.getPatient(id)
        console.log('✅ [EditPatient] Patient data loaded:', patient)

        // Initialize form data
        setFormData({
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          email: patient.email || '',
          phone: patient.phone || '',
          notes: patient.notes || ''
        })

        setPatientData(patient)

      } catch (error: any) {
        console.error('❌ [EditPatient] Failed to load patient:', error)

        if (error.status === 404) {
          setLoadError(t('patients.error_not_found'))
        } else if (error.status >= 500) {
          setLoadError(t('patients.error_server'))
        } else {
          setLoadError(t('patients.error_load_failed'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPatientData()
  }, [id])

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

    if (!validateForm() || !id) {
      return
    }

    setIsSubmitting(true)

    try {
      console.log('👤 [EditPatient] Submitting patient update:', {
        id,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined
      })

      // Update patient with proper API payload
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined
      }

      const updatedPatient = await patientsService.updatePatient(id, updateData)
      console.log('✅ [EditPatient] Patient updated successfully:', updatedPatient)

      // Update local patient data to reflect changes
      setPatientData(updatedPatient)

      // Success feedback is handled automatically by HTTP interceptor

      // Stay on edit page (don't navigate away like tenant edit)

    } catch (error: any) {
      console.error('❌ [EditPatient] Failed to update patient:', error)

      // Map backend errors to user-friendly messages
      let errorMessage = 'Failed to update patient. Please try again.'

      // Handle specific error cases based on backend responses
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        errorMessage = 'A patient with this email already exists. Please use a different email.'
      } else if (error.message?.includes('Validation Error')) {
        errorMessage = 'Please check your input and try again.'
      } else if (error.status === 409) {
        errorMessage = 'Conflict detected. Please refresh and try again.'
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to edit this patient.'
      } else if (error.status === 404) {
        errorMessage = 'Patient not found. It may have been deleted.'
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }

      console.error('❌ [EditPatient] Update error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/patients')
  }

  const handleBackToList = () => {
    navigate('/patients')
  }

  const handleRetry = () => {
    window.location.reload()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.edit')}</h1>
          <p className="text-gray-600 mt-1">{t('patients.loading_patient')}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B725B7]"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.edit')}</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert" aria-live="assertive">
          <div className="flex items-center">
            <div className="text-red-800">
              <h3 className="font-medium">{t('patients.error_loading')}</h3>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <Button variant="secondary" onClick={handleBackToList}>
              {t('patients.back_to_list')}
            </Button>
            <Button variant="default" onClick={handleRetry}>
              {t('common.try_again')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('patients.edit_subtitle')}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/patients/${id}/history`)}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          {t('patients.view_history')}
        </Button>
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

          {/* Timestamp Information */}
          {patientData && (
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('patients.record_information')}</h2>
              </CardHeader>

              <CardContent className="space-y-6 px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label={t('common.created_at')}
                    value={formatDate(patientData.created_at)}
                    disabled
                    helperText={t('patients.helper.created_at')}
                  />

                  <Input
                    label={t('common.updated_at')}
                    value={formatDate(patientData.updated_at)}
                    disabled
                    helperText={t('patients.helper.updated_at')}
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
            {isSubmitting ? t('common.saving') : t('common.save_changes')}
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