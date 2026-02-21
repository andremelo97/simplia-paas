import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, CardContent, isEditorContentFilled } from '@client/common/ui'
import { patientsService } from '../../services/patients'
import { quotesService } from '../../services/quotes'
import { useAuthStore } from '../../shared/store'
import {
  DocumentType,
  DocumentData,
  DocumentConfig,
  getDocumentConfig
} from './documentConfig'
import {
  PatientSessionCard,
  DocumentMetadataCard,
  DocumentContentCard,
  PatientData,
  SessionData,
  PatientErrors
} from './components'
import {
  QuoteFormSection,
  QuoteFormState,
  ClinicalNoteFormSection,
  ClinicalNoteHeaderAction,
  PreventionFormSection,
  PreventionFormState
} from './sections'

export const EditDocument: React.FC = () => {
  const { t } = useTranslation('tq')
  const { documentType, id } = useParams<{ documentType: string; id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  // Get config for document type
  const config = getDocumentConfig(documentType || '')

  // Common state
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [contentError, setContentError] = useState('')

  // Patient state
  const [patient, setPatient] = useState<PatientData>({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCountryCode: '55'
  })
  const [patientErrors, setPatientErrors] = useState<PatientErrors>({
    firstName: '',
    lastName: '',
    email: ''
  })

  // Session state (read-only)
  const [session, setSession] = useState<SessionData>({})

  // Quote-specific state
  const [quoteFormState, setQuoteFormState] = useState<QuoteFormState>({
    status: 'draft',
    items: [],
    showGenerateModal: false
  })

  // Prevention-specific state
  const [preventionFormState, setPreventionFormState] = useState<PreventionFormState>({
    showGenerateModal: false
  })

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Load document data
  useEffect(() => {
    if (!id || !config) return

    let isCancelled = false

    const loadDocument = async () => {
      try {
        setIsLoading(true)
        const data = await config.getById(id)

        if (!isCancelled) {
          setDocument(data)
          setContent(data.content || '')
          setStatus(data.status || 'draft')
          setContentError('')

          // Load patient data
          setPatient({
            id: data.patient_id || null,
            firstName: data.patient_first_name || '',
            lastName: data.patient_last_name || '',
            email: data.patient_email || '',
            phone: data.patient_phone || '',
            phoneCountryCode: data.patient_phone_country_code || '55'
          })
          setPatientErrors({ firstName: '', lastName: '', email: '' })

          // Load session data
          setSession({
            number: data.session_number,
            status: data.session_status
          })

          // Quote-specific: load items
          if (config.type === 'quote' && data.items) {
            const itemsWithLocalId = data.items.map((item: any) => ({
              localId: item.id,
              itemId: item.itemId,
              itemName: item.name,
              itemBasePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
              quantity: item.quantity,
              discountAmount: item.discountAmount
            }))
            setQuoteFormState(prev => ({ ...prev, items: itemsWithLocalId, status: data.status || 'draft' }))
          }

          setLoadError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load document')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      isCancelled = true
    }
  }, [id, config])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (contentError && isEditorContentFilled(newContent)) {
      setContentError('')
    }
  }

  const handlePatientChange = (field: keyof Omit<PatientData, 'id'>, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }))

    // Clear validation errors on change
    if (field === 'firstName' && patientErrors.firstName && value.trim()) {
      setPatientErrors(prev => ({ ...prev, firstName: '' }))
    }
    if (field === 'lastName' && patientErrors.lastName && value.trim()) {
      setPatientErrors(prev => ({ ...prev, lastName: '' }))
    }
    if (field === 'email' && patientErrors.email) {
      if (value.trim() && emailPattern.test(value.trim())) {
        setPatientErrors(prev => ({ ...prev, email: '' }))
      }
    }
  }

  const handleSave = async () => {
    if (!id || !document || !config) return

    // Validate patient if present
    const hasPatient = Boolean(patient.id)
    const newPatientErrors: PatientErrors = { firstName: '', lastName: '', email: '' }

    if (hasPatient) {
      if (!patient.firstName.trim()) {
        newPatientErrors.firstName = t('common:field_required')
      }
      if (!patient.lastName.trim()) {
        newPatientErrors.lastName = t('common:field_required')
      }
      // Email is only required for quotes and prevention, not clinical notes
      if (config.type !== 'clinical-note') {
        if (!patient.email.trim()) {
          newPatientErrors.email = t('common:field_required')
        } else if (!emailPattern.test(patient.email.trim())) {
          newPatientErrors.email = t('patients.validation.email_invalid')
        }
      } else if (patient.email.trim() && !emailPattern.test(patient.email.trim())) {
        newPatientErrors.email = t('patients.validation.email_invalid')
      }
    }

    setPatientErrors(newPatientErrors)

    // Validate content
    const contentIsEmpty = !isEditorContentFilled(content)
    const newContentError = contentIsEmpty ? t('common:field_required') : ''
    setContentError(newContentError)

    if ((hasPatient && Object.values(newPatientErrors).some(Boolean)) || newContentError) {
      return
    }

    setIsSaving(true)

    try {
      // 1. Update patient if changed
      if (patient.id) {
        const patientChanged =
          patient.firstName !== (document.patient_first_name || '') ||
          patient.lastName !== (document.patient_last_name || '') ||
          patient.email !== (document.patient_email || '') ||
          patient.phone !== (document.patient_phone || '') ||
          patient.phoneCountryCode !== (document.patient_phone_country_code || '55')

        if (patientChanged) {
          await patientsService.updatePatient(patient.id, {
            first_name: patient.firstName.trim(),
            last_name: patient.lastName.trim(),
            email: patient.email.trim() || undefined,
            phone: patient.phone || undefined,
            phone_country_code: patient.phone ? patient.phoneCountryCode : undefined
          })
        }
      }

      // 2. Update document content and status
      const documentChanged =
        content !== (document.content || '') ||
        (config.hasStatus && status !== document.status)

      if (documentChanged) {
        const updateData: any = { content }
        if (config.hasStatus) {
          updateData.status = status
        }
        await config.update(id, updateData)
      }

      // 3. Quote-specific: update items
      if (config.type === 'quote') {
        const itemsToSave = quoteFormState.items
          .filter((item: any) => item.itemId && !item.isSearchMode)
          .map((item: any) => ({
            itemId: item.itemId,
            quantity: item.quantity || 1,
            discountAmount: item.discountAmount || 0
          }))

        const currentItems = document.items || []
        const hasItemChanges = itemsToSave.length > 0 || currentItems.length > 0

        if (hasItemChanges) {
          const { items: updatedItems } = await quotesService.replaceQuoteItems(id, {
            items: itemsToSave
          })

          const itemsWithLocalId = updatedItems.map((item: any) => ({
            localId: item.id,
            itemId: item.itemId,
            itemName: item.name,
            itemBasePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
            quantity: item.quantity,
            discountAmount: item.discountAmount,
            isSearchMode: false
          }))
          setQuoteFormState(prev => ({ ...prev, items: itemsWithLocalId }))
        }
      }

      // 4. Refresh document data
      const freshDocument = await config.getById(id)
      setDocument(freshDocument)
      setContent(freshDocument.content || '')
      setStatus(freshDocument.status || 'draft')

      // Update patient state
      setPatient({
        id: freshDocument.patient_id || null,
        firstName: freshDocument.patient_first_name || '',
        lastName: freshDocument.patient_last_name || '',
        email: freshDocument.patient_email || '',
        phone: freshDocument.patient_phone || '',
        phoneCountryCode: freshDocument.patient_phone_country_code || '55'
      })

    } catch (error) {
      // Error handled by HTTP interceptor
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (config) {
      navigate(config.backPath)
    }
  }

  // Render header action based on document type
  const renderHeaderAction = () => {
    if (!config || !id) return null

    switch (config.type) {
      case 'clinical-note':
        return <ClinicalNoteHeaderAction documentId={id} config={config} document={document} patientName={`${patient.firstName} ${patient.lastName}`.trim()} />
      default:
        return null
    }
  }

  // Render form section based on document type
  const renderFormSection = () => {
    if (!config || !document || !id) return null

    const patientName = `${patient.firstName} ${patient.lastName}`.trim()

    switch (config.type) {
      case 'quote':
        return (
          <QuoteFormSection
            document={document}
            documentId={id}
            config={config}
            formState={quoteFormState}
            onFormStateChange={(state) => setQuoteFormState(prev => ({ ...prev, ...state }))}
            patientName={patientName}
            patientEmail={patient.email}
            patientPhone={patient.phone}
            patientPhoneCountryCode={patient.phoneCountryCode}
            canEdit={canEdit}
          />
        )
      case 'clinical-note':
        return (
          <ClinicalNoteFormSection
            document={document}
            documentId={id}
            config={config}
            formState={{}}
            onFormStateChange={() => {}}
            canEdit={canEdit}
          />
        )
      case 'prevention':
        return (
          <PreventionFormSection
            document={document}
            documentId={id}
            config={config}
            formState={preventionFormState}
            onFormStateChange={(updates) => setPreventionFormState(prev => ({ ...prev, ...updates }))}
            patientName={patientName}
            patientEmail={patient.email}
            patientPhone={patient.phone}
            patientPhoneCountryCode={patient.phoneCountryCode}
            canEdit={canEdit}
          />
        )
      default:
        return null
    }
  }

  // Invalid document type
  if (!config) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common.error')}</h1>
          <p className="text-red-600 mt-1">Invalid document type: {documentType}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/documents')}>
          {t('common.back')}
        </Button>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t(`${config.i18nKey}.edit`, t('quotes.edit'))}
          </h1>
          <p className="text-gray-600 mt-1">
            {t(`${config.i18nKey}.loading`, t('quotes.loading_quote'))}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError || !document) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t(`${config.i18nKey}.edit`, t('quotes.edit'))}
          </h1>
          <p className="text-red-600 mt-1">
            {loadError || t(`${config.i18nKey}.not_found`, t('quotes.quote_not_found'))}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(config.backPath)}>
          {t(`${config.i18nKey}.back`, t('common.back'))}
        </Button>
      </div>
    )
  }

  const patientName = `${patient.firstName} ${patient.lastName}`.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:sticky sm:top-0 sm:z-30 sm:bg-white sm:pb-4 sm:border-b sm:border-gray-200 sm:-mx-4 lg:-mx-6 sm:px-4 lg:px-6 sm:-mt-4 lg:-mt-6 sm:pt-4 lg:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t(`${config.i18nKey}.edit`, t('quotes.edit'))}
          </h1>
          <p className="text-gray-600 mt-1">
            {t(`${config.i18nKey}.${config.type === 'quote' ? 'quote' : config.type === 'clinical-note' ? 'note' : 'prevention'}`, document.number)} {document.number} • {patientName || ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {renderHeaderAction()}
          {canEdit && (
            <>
              {renderHeaderAction() && <div className="h-6 w-px bg-gray-300 hidden sm:block" />}
              <Button
                variant="default"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('common.save_changes')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
        {/* Left Column - 60% - Document Details */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Metadata Card */}
            <DocumentMetadataCard
              document={document}
              config={config}
              status={status}
              onStatusChange={setStatus}
              disabled={!canEdit || isSaving}
            />

            {/* Content Card */}
            <DocumentContentCard
              content={content}
              onChange={handleContentChange}
              config={config}
              disabled={!canEdit || isSaving}
              error={contentError}
            />

          </div>
        </div>

        {/* Right Column - 40% - Patient & Type-specific */}
        <div className="lg:col-span-2">
          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Patient and Session Information */}
            <PatientSessionCard
              patient={patient}
              session={session}
              onPatientChange={handlePatientChange}
              patientErrors={patientErrors}
              disabled={!canEdit || isSaving}
              i18nKey={config.i18nKey}
              emailRequired={config.type !== 'clinical-note'}
            />

            {/* Type-specific form section */}
            {renderFormSection()}
          </div>
        </div>
      </div>

    </div>
  )
}
