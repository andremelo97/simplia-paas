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
  LinkToast
} from '@client/common/ui'
import { quotesService, Quote, QuoteItemInput } from '../../services/quotes'
import { patientsService } from '../../services/patients'
import { publicQuotesService, PublicQuoteTemplate } from '../../services/publicQuotes'
import { QuoteItemsManager } from './QuoteItemsManager'
import { GeneratePublicQuoteModal } from '../../components/quotes/GeneratePublicQuoteModal'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { getQuoteStatusOptions } from '../../types/quoteStatus'

export const EditQuote: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatDateTime } = useDateFormatter()

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
  const [templates, setTemplates] = useState<PublicQuoteTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  
  // LinkToast state for Public Quote
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{publicQuoteId: string, publicUrl: string, password: string} | null>(null)
  const [isGeneratingPublicQuote, setIsGeneratingPublicQuote] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const response = await publicQuotesService.listTemplates({ active: true })
        setTemplates(response.data)

        // Set default template if exists
        const defaultTemplate = response.data.find(t => t.isDefault)
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id)
        }
      } catch (error) {
        console.error('Failed to load templates:', error)
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
          setStatus(quoteData.status || 'draft')

          // Load patient data
          setPatientFirstName(quoteData.patient_first_name || '')
          setPatientLastName(quoteData.patient_last_name || '')
          setPatientEmail(quoteData.patient_email || '')
          setPatientPhone(quoteData.patient_phone || '')
          setPatientId(quoteData.patient_id || null)

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
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
  }

  const handleSave = async () => {
    if (!id || !quote) return

    setIsSaving(true)

    try {
      let itemsChanged = false

      // 1. Update patient data if changed
      if (patientId) {
        const patientChanged =
          patientFirstName !== (quote.patient_first_name || '') ||
          patientLastName !== (quote.patient_last_name || '') ||
          patientEmail !== (quote.patient_email || '') ||
          patientPhone !== (quote.patient_phone || '')

        if (patientChanged) {
          await patientsService.updatePatient(patientId, {
            first_name: patientFirstName,
            last_name: patientLastName,
            email: patientEmail || undefined,
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

      // 3. Check if items changed
      const currentItems = quote.items || []
      const itemsToSave = quoteItems
        .filter(item => item.itemId && !item.isSearchMode)
        .map(item => ({
          itemId: item.itemId,
          quantity: item.quantity || 1,
          discountAmount: item.discountAmount || 0
        }))

      // Compare items: different length or different content
      if (currentItems.length !== itemsToSave.length) {
        itemsChanged = true
      } else {
        // Compare each item
        for (let i = 0; i < currentItems.length; i++) {
          const current = currentItems[i]
          const toSave = itemsToSave[i]
          if (
            current.itemId !== toSave.itemId ||
            current.quantity !== toSave.quantity ||
            current.discountAmount !== toSave.discountAmount
          ) {
            itemsChanged = true
            break
          }
        }
      }

      // 4. Update quote items only if changed
      if (itemsChanged) {
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

      // Update items if not already updated
      if (!itemsChanged && freshQuote.items) {
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
      console.error('Failed to update quote:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/quotes')
  }

  const handleGeneratePublicQuote = async () => {
    if (!id || !selectedTemplateId) return

    setIsGeneratingPublicQuote(true)

    try {
      await publicQuotesService.createPublicQuote({
        quoteId: id,
        templateId: selectedTemplateId
      })

      // Navigate to public quotes links tab
      navigate('/public-quotes/links')
    } catch (error) {
      console.error('Failed to generate public quote:', error)
    } finally {
      setIsGeneratingPublicQuote(false)
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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

  const handleViewPublicLink = () => {
    if (quote?.number) {
      navigate(`/public-quotes/links?quote=${encodeURIComponent(quote.number)}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('quotes.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('quotes.quote')} {quote.number} • {quote.patient_first_name || quote.patient_last_name ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim() : ''}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleViewPublicLink}
        >
          {t('quotes.view_public_link')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                    disabled={isSaving}
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
              </CardContent>
            </Card>

            {/* Quote Content */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('quotes.quote_content')}</h2>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <TemplateEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder={t('quotes.placeholders.content')}
                  readonly={isSaving}
                  minHeight="500px"
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
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
                style={{ height: '32px', minHeight: '32px' }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column - 40% - Patient & Items */}
        <div className="lg:col-span-2">
          <div className="space-y-6 sticky top-6">
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
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.first_name')}
                          </label>
                          <input
                            type="text"
                            value={patientFirstName}
                            onChange={(e) => setPatientFirstName(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.last_name')}
                          </label>
                          <input
                            type="text"
                            value={patientLastName}
                            onChange={(e) => setPatientLastName(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.email')}
                          </label>
                          <input
                            type="email"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            {t('patients.phone')}
                          </label>
                          <input
                            type="text"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            disabled={isSaving}
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-sm shadow-sm transition-all focus-visible:outline-none hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#B725B7] focus-visible:border-[#B725B7]"
                          />
                        </div>
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
            />

            {/* Public Quote Template Selection */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('quotes.public_quote')}</h2>
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
                      onClick={() => window.open(`/quotes/${id}/preview-public-quote/${selectedTemplateId}`, '_blank')}
                      disabled={!selectedTemplateId}
                    >
                      {t('quotes.preview_template')}
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setShowGenerateModal(true)}
                    >
                      {t('quotes.generate_public_quote')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Generate Public Quote Modal */}
      {quote && (
        <GeneratePublicQuoteModal
          open={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          quoteId={quote.id}
          quoteNumber={quote.number}
          patientName={`${patientFirstName} ${patientLastName}`.trim()}
          patientEmail={patientEmail}
          patientPhone={patientPhone}
          onSuccess={(publicQuote) => {
            console.log('Public quote generated:', publicQuote)
            setShowGenerateModal(false)
          }}
          onShowToast={(data) => {
            setToastData(data)
            setShowLinkToast(true)
          }}
        />
      )}
      
      {/* Link Toast for Public Quote */}
      {toastData && quote && (
        <LinkToast
          show={showLinkToast}
          itemNumber={quote.number}
          itemId={toastData.publicQuoteId}
          onClose={() => setShowLinkToast(false)}
          type="public-quote"
          publicUrl={toastData.publicUrl}
          password={toastData.password}
          duration={15000}
          darkBackground={true}
        />
      )}
    </div>
  )
}