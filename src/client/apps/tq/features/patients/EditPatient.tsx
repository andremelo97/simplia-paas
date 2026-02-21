import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { History } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Input, Textarea, PhoneInput } from '@client/common/ui'
import { useDeviceType } from '@shared/hooks/use-device-type'
import { patientsService, Patient } from '../../services/patients'
import { formatDate } from '@client/common/utils/dateUtils'

interface PatientFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  phone_country_code: string
  notes: string
}

export const EditPatient: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    phone_country_code: '55',
    notes: ''
  })
  const [patientData, setPatientData] = useState<Patient | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const device = useDeviceType()

  // Load existing patient data
  useEffect(() => {
    const loadPatientData = async () => {
      if (!id) {
        setLoadError(t('patients.error_id_required'))
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const patient = await patientsService.getPatient(id)

        // Initialize form data
        setFormData({
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          email: patient.email || '',
          phone: patient.phone || '',
          phone_country_code: patient.phone_country_code || '55',
          notes: patient.notes || ''
        })

        setPatientData(patient)

      } catch (error: any) {

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

  const validateField = (field: keyof PatientFormData, value: string) => {
    let error = ''

    switch (field) {
      case 'first_name':
        if (!value.trim()) {
          error = t('patients.validation.first_name_required')
        } else if (value.length < 2) {
          error = t('patients.validation.first_name_min')
        } else if (value.length > 50) {
          error = t('patients.validation.first_name_max')
        }
        break
      case 'last_name':
        if (value && value.length > 50) {
          error = t('patients.validation.last_name_max')
        }
        break
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = t('patients.validation.email_invalid')
        }
        break
      case 'phone':
        if (value && value.length > 20) {
          error = t('patients.validation.phone_max')
        }
        break
      case 'notes':
        if (value && value.length > 500) {
          error = t('patients.validation.notes_max')
        }
        break
    }

    setValidationErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  const handleBlur = (field: keyof PatientFormData) => () => {
    validateField(field, formData[field])
  }

  const validateForm = () => {
    const fields: (keyof PatientFormData)[] = ['first_name', 'last_name', 'email', 'phone', 'notes']
    let allValid = true
    for (const field of fields) {
      if (!validateField(field, formData[field])) {
        allValid = false
      }
    }
    return allValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !id) {
      return
    }

    setIsSubmitting(true)

    try {
      // Update patient with proper API payload
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        phone_country_code: formData.phone.trim() ? formData.phone_country_code : undefined,
        notes: formData.notes.trim() || undefined
      }

      const updatedPatient = await patientsService.updatePatient(id, updateData)

      // Update local patient data to reflect changes
      setPatientData(updatedPatient)

      // Success feedback is handled automatically by HTTP interceptor

      // Stay on edit page (don't navigate away like tenant edit)

    } catch (error: any) {

      // Map backend errors to user-friendly messages
      let errorMessage = t('patients.error_update_failed')

      // Handle specific error cases based on backend responses
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        errorMessage = t('patients.error_duplicate_email')
      } else if (error.message?.includes('Validation Error')) {
        errorMessage = t('patients.error_validation')
      } else if (error.status === 409) {
        errorMessage = t('patients.error_conflict')
      } else if (error.status === 403) {
        errorMessage = t('patients.error_no_permission')
      } else if (error.status === 404) {
        errorMessage = t('patients.error_not_found')
      } else if (error.status === 401) {
        errorMessage = t('patients.error_session_expired')
      } else if (error.status >= 500) {
        errorMessage = t('patients.error_server')
      }
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
      <div className="sm:sticky sm:top-0 sm:z-30 sm:bg-white sm:pb-4 sm:border-b sm:border-gray-200 sm:-mx-4 lg:-mx-6 sm:px-4 lg:px-6 sm:-mt-4 lg:-mt-6 sm:pt-4 lg:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('patients.edit_subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {device !== 'mobile' && (
            <Button
              variant="primary"
              onClick={() => navigate(`/patients/${id}/history`)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {t('patients.view_history')}
            </Button>
          )}
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <Button
            type="submit"
            form="editPatientForm"
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
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>

      <form id="editPatientForm" onSubmit={handleSubmit}>
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
                  onBlur={handleBlur('first_name')}
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
                  onBlur={handleBlur('last_name')}
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
                  onBlur={handleBlur('email')}
                  error={validationErrors.email}
                  placeholder={t('patients.placeholders.email')}
                  helperText={t('patients.helper.email')}
                  disabled={isSubmitting}
                />

                <PhoneInput
                  label={t('patients.phone')}
                  phoneValue={formData.phone}
                  countryCodeValue={formData.phone_country_code}
                  onPhoneChange={handleInputChange('phone')}
                  onCountryCodeChange={(code) => setFormData(prev => ({ ...prev, phone_country_code: code }))}
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
                  onBlur={handleBlur('notes')}
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

      </form>
    </div>
  )
}