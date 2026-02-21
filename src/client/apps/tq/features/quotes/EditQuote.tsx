import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  TemplateEditor,
  isEditorContentFilled
} from '@client/common/ui'
import { quotesService, Quote, QuoteItemInput } from '../../services/quotes'
import { patientsService } from '../../services/patients'
import { landingPagesService, LandingPageTemplate } from '../../services/landingPages'
import { QuoteItemsManager } from './QuoteItemsManager'
import { GenerateLandingPageModal } from '../../components/landing-pages/GenerateLandingPageModal'
import { LandingPageLinksSection } from '../../components/landing-pages/LandingPageLinksSection'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { getQuoteStatusOptions } from '../../types/quoteStatus'
import { useAuthStore } from '../../shared/store'

export const EditQuote: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatDateTime } = useDateFormatter()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [quote, setQuote] = useState<Quote | null>(null)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [quoteItems, setQuoteItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Patient data state (editable)
  const [patientFirstName, setPatientFirstName] = useState('')
  const [patientLastName, setPatientLastName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientId, setPatientId] = useState<string | null>(null)

  // Public Quote Template state
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [patientErrors, setPatientErrors] = useState({ firstName: '', lastName: '', email: '' })
  const [contentError, setContentError] = useState('')

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const response = await landingPagesService.listTemplates({ active: true })
        setTemplates(response.data)

        // Set default template if exists
        const defaultTemplate = response.data.find(t => t.isDefault)
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id)
        }
      } catch (error) {
        // Failed to load templates
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [])

  // Load quote data
  useEffect(() => {
    if (!id) return

    let isCancelled = false

    const loadQuoteData = async () => {
      try {
        setIsLoading(true)
        const quoteData = await quotesService.getQuote(id)

        if (!isCancelled) {
          setQuote(quoteData)
          setContent(quoteData.content || '')
          setContentError('')
          setStatus(quoteData.status || 'draft')

          // Load patient data
          setPatientFirstName(quoteData.patient_first_name || '')
          setPatientLastName(quoteData.patient_last_name || '')
          setPatientEmail(quoteData.patient_email || '')
          setPatientPhone(quoteData.patient_phone || '')
          setPatientId(quoteData.patient_id || null)
          setPatientErrors({ firstName: '', lastName: '', email: '' })

          // Load quote items with localId for frontend management
          const items = quoteData.items || []
          const itemsWithLocalId = items.map((item: any) => ({
            localId: item.id,
            itemId: item.itemId,
            itemName: item.name,
            itemBasePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
            quantity: item.quantity,
            discountAmount: item.discountAmount
          }))
          setQuoteItems(itemsWithLocalId)

          setLoadError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load quote')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadQuoteData()

    return () => {
      isCancelled = true
    }
  }, [id])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (contentError && isEditorContentFilled(newContent)) {
      setContentError('')
    }
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
  }

  const handleSave = async () => {
    if (!id || !quote) return

    const hasPatient = Boolean(patientId)
    const trimmedFirstName = patientFirstName.trim()
    const trimmedLastName = patientLastName.trim()
    const trimmedEmail = patientEmail.trim()

    const newPatientErrors = {
      firstName: '',
      lastName: '',
      email: ''
    }

    if (hasPatient) {
      if (!trimmedFirstName) {
        newPatientErrors.firstName = t('common:field_required')
      }

      if (!trimmedLastName) {
        newPatientErrors.lastName = t('common:field_required')
      }

      if (!trimmedEmail) {
        newPatientErrors.email = t('common:field_required')
      } else if (!emailPattern.test(trimmedEmail)) {
        newPatientErrors.email = t('patients.validation.email_invalid')
      }
    }

    setPatientErrors(newPatientErrors)

    const contentIsEmpty = !isEditorContentFilled(content)
    const newContentError = contentIsEmpty ? t('common:field_required') : ''
    setContentError(newContentError)

    if ((hasPatient && Object.values(newPatientErrors).some(Boolean)) || newContentError) {
      return
    }

    setIsSaving(true)

    try {
      // 1. Update patient data if changed
      if (patientId) {
        const patientChanged =
          trimmedFirstName !== (quote.patient_first_name || '') ||
          trimmedLastName !== (quote.patient_last_name || '') ||
          trimmedEmail !== (quote.patient_email || '') ||
          patientPhone !== (quote.patient_phone || '')

        if (patientChanged) {
          await patientsService.updatePatient(patientId, {
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            email: trimmedEmail || undefined,
            phone: patientPhone || undefined
          })
        }
      }

      // 2. Update quote content and status if changed
      const quoteChanged =
        content !== (quote.content || '') ||
        status !== quote.status

      if (quoteChanged) {
        await quotesService.updateQuote(id, {
          content,
          status
        })
      }

      // 3. Prepare items to save
      const itemsToSave = quoteItems
        .filter(item => item.itemId && !item.isSearchMode)
        .map(item => ({
          itemId: item.itemId,
          quantity: item.quantity || 1,
          discountAmount: item.discountAmount || 0
        }))

      // 4. Always update quote items if there are any items OR if items were cleared
      // This ensures the quote total is always recalculated with fresh item prices
      const currentItems = quote.items || []
      const hasItemChanges = itemsToSave.length > 0 || currentItems.length > 0

      if (hasItemChanges) {
        const { items: updatedItems } = await quotesService.replaceQuoteItems(id, {
          items: itemsToSave
        })

        // Update items with server response
        const itemsWithLocalId = updatedItems.map((item: any) => ({
          localId: item.id,
          itemId: item.itemId,
          itemName: item.name,
          itemBasePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
          quantity: item.quantity,
          discountAmount: item.discountAmount,
          isSearchMode: false
        }))
        setQuoteItems(itemsWithLocalId)
      }

      // 5. Fetch fresh quote data to ensure all data is updated
      const freshQuote = await quotesService.getQuote(id)

      // Update local state with fresh data
      setQuote(freshQuote)
      setContent(freshQuote.content || '')
      setStatus(freshQuote.status || 'draft')

      // Update patient state with fresh data
      setPatientFirstName(freshQuote.patient_first_name || '')
      setPatientLastName(freshQuote.patient_last_name || '')
      setPatientEmail(freshQuote.patient_email || '')
      setPatientPhone(freshQuote.patient_phone || '')

      // Update items if not already updated by hasItemChanges
      if (!hasItemChanges && freshQuote.items) {
        const itemsWithLocalId = freshQuote.items.map((item: any) => ({
          localId: item.id,
          itemId: item.itemId,
          itemName: item.name,
          itemBasePrice: typeof item.basePrice === 'string' ? parseFloat(item.basePrice) : item.basePrice,
          quantity: item.quantity,
          discountAmount: item.discountAmount,
          isSearchMode: false
        }))
        setQuoteItems(itemsWithLocalId)
      }

      // Success feedback is handled automatically by HTTP interceptor
    } catch (error) {
      // Error is handled by HTTP interceptor
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/quotes')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return formatDateTime(dateString)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quotes.edit')}</h1>
          <p className="text-gray-600 mt-1">{t('quotes.loading_quote')}</p>
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

  if (loadError || !quote) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quotes.edit')}</h1>
          <p className="text-red-600 mt-1">{loadError || t('quotes.quote_not_found')}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/quotes')}>
          {t('quotes.back_to_quotes')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quotes.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('quotes.quote')} {quote.number} • {quote.patient_first_name || quote.patient_last_name ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim() : ''}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center space-x-3">
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
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
        {/* Left Column - 60% - Quote Details */}
        <div className="lg:col-span-3">
          <div className="space-y-6">
            {/* Quote Metadata */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('quotes.quote_information')}</h2>
              </CardHeader>

              <CardContent className="space-y-4 px-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('quotes.quote_number')}
                    value={quote.number}
                    disabled
                    readOnly
                  />

                  <Select
                    label={t('common.status')}
                    value={status}
                    onChange={handleStatusChange}
                    options={getQuoteStatusOptions()}
                    disabled={!canEdit || isSaving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('common.created_at')}
                    value={formatDate(quote.created_at)}
                    disabled
                    readOnly
                  />

                  <Input
                    label={t('common.updated_at')}
                    value={formatDate(quote.updated_at)}
                    disabled
                    readOnly
                  />
                </div>

                <Input
                  label={t('common.created_by')}
                  value={quote.createdBy
                    ? `${quote.createdBy.firstName || ''} ${quote.createdBy.lastName || ''}`.trim()
                    : '—'
                  }
                  disabled
                  readOnly
                />
              </CardContent>
            </Card>

            {/* Quote Content */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('quotes.quote_content')}
                  <span className="ml-1 text-red-500" aria-hidden="true">*</span>
                </h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <TemplateEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder={t('quotes.placeholders.content')}
                  readonly={!canEdit || isSaving}
                  minHeight="500px"
                  required
                  error={contentError}
                  requiredMessage={t('common:field_required')}
                />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Right Column - 40% - Patient & Items */}
        <div className="lg:col-span-2">
          <div className="space-y-6 lg:sticky lg:top-6">
            {/* Patient and Session Information */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('quotes.patient_session_info')}</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
                  {/* Patient Info - Left */}
                  <div className="space-y-2 pr-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('common.patient')}</h3>
                    {patientId ? (
                      <div className="space-y-3">
                        <Input
                          label={t('patients.first_name')}
                          value={patientFirstName}
                          onChange={(e) => {
                            const value = e.target.value
                            setPatientFirstName(value)
                            if (patientErrors.firstName && value.trim()) {
                              setPatientErrors(prev => ({ ...prev, firstName: '' }))
                            }
                          }}
                          disabled={!canEdit || isSaving}
                          required
                          error={patientErrors.firstName}
                        />

                        <Input
                          label={t('patients.last_name')}
                          value={patientLastName}
                          onChange={(e) => {
                            const value = e.target.value
                            setPatientLastName(value)
                            if (patientErrors.lastName && value.trim()) {
                              setPatientErrors(prev => ({ ...prev, lastName: '' }))
                            }
                          }}
                          disabled={!canEdit || isSaving}
                          required
                          error={patientErrors.lastName}
                        />

                        <Input
                          label={t('patients.email')}
                          type="email"
                          value={patientEmail}
                          onChange={(e) => {
                            const value = e.target.value
                            setPatientEmail(value)
                            if (patientErrors.email) {
                              if (value.trim() && emailPattern.test(value.trim())) {
                                setPatientErrors(prev => ({ ...prev, email: '' }))
                              } else if (!value.trim()) {
                                setPatientErrors(prev => ({ ...prev, email: '' }))
                              }
                            }
                          }}
                          disabled={!canEdit || isSaving}
                          required
                          error={patientErrors.email}
                        />

                        <Input
                          label={t('patients.phone')}
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          disabled={!canEdit || isSaving}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t('quotes.no_patient_data')}</p>
                    )}
                  </div>

                  {/* Session Info - Right */}
                  <div className="space-y-2 pl-4">
                    <h3 className="text-xs font-semibold text-gray-900 mb-2">{t('sessions.session')}</h3>
                    {quote.session_number ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('sessions.number')}
                          </label>
                          <p className="text-sm text-gray-900">{quote.session_number}</p>
                        </div>

                        {quote.session_status && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              {t('common.status')}
                            </label>
                            <p className="text-sm text-gray-900 capitalize">{quote.session_status}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">{t('quotes.no_session_data')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <QuoteItemsManager
              quoteId={id!}
              initialItems={quoteItems}
              onItemsChange={setQuoteItems}
              readonly={!canEdit}
            />

            {/* Landing Page - Only show for users who can edit */}
            {canEdit && (
              <Card>
                <CardHeader className="p-6 pb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t('landing_pages.title', 'Landing Page')}</h2>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6">
                  <Select
                    label={t('quotes.template')}
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    options={[
                      { value: '', label: t('quotes.select_template') },
                      ...templates.map(t => ({ value: t.id, label: t.name }))
                    ]}
                    disabled={isLoadingTemplates}
                    helperText={t('quotes.select_template_helper')}
                  />

                  {selectedTemplateId && (
                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => window.open(`/documents/quote/${id}/preview/${selectedTemplateId}`, '_blank')}
                        disabled={!selectedTemplateId}
                      >
                        {t('quotes.preview_template')}
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setShowGenerateModal(true)}
                      >
                        {t('landing_pages.generate', 'Generate Landing Page')}
                      </Button>

                      <Button
                        type="button"
                        variant="tertiary"
                        onClick={() => navigate(`/landing-pages/links?document=${encodeURIComponent(quote.number)}&documentType=quote`)}
                      >
                        {t('landing_pages.view_landing_pages', 'View Landing Pages')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shared Links List */}
            {quote && (
              <LandingPageLinksSection
                documentId={quote.id}
                documentType="quote"
                documentNumber={quote.number}
                patientName={`${patientFirstName} ${patientLastName}`.trim()}
                patientEmail={patientEmail}
                patientPhone={patientPhone}
              />
            )}

          </div>
        </div>
      </div>

      {/* Generate Landing Page Modal */}
      {quote && (
        <GenerateLandingPageModal
          open={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          documentId={quote.id}
          documentType="quote"
          documentNumber={quote.number}
          patientName={`${patientFirstName} ${patientLastName}`.trim()}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          onSuccess={() => window.dispatchEvent(new Event('landing-page-created'))}
        />
      )}
      
    </div>
  )
}
