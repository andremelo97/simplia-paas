import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Select,
  Input,
  DateInput
} from '@client/common/ui'
import { Copy, CheckCircle2 } from 'lucide-react'
import { landingPagesService, LandingPageTemplate } from '../../services/landingPages'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

interface GeneratePublicQuoteModalProps {
  open: boolean
  onClose: () => void
  quoteId: string
  quoteNumber: string
  patientName?: string
  patientEmail?: string
  patientPhone?: string
  onSuccess?: (publicQuote: any) => void
  onShowToast?: (data: { publicQuoteId: string, publicUrl: string, password: string }) => void
}

export const GeneratePublicQuoteModal: React.FC<GeneratePublicQuoteModalProps> = ({
  open,
  onClose,
  quoteId,
  quoteNumber,
  patientName,
  patientEmail,
  patientPhone,
  onSuccess,
  onShowToast
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuote, setGeneratedQuote] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Load templates when modal opens
  useEffect(() => {
    if (open) {
      loadTemplates()
      setGeneratedQuote(null) // Reset generated quote when reopening
    }
  }, [open])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await landingPagesService.listTemplates({ active: true })
      setTemplates(response.data || [])

      // Auto-select default template
      const defaultTemplate = response.data?.find((t: LandingPageTemplate) => t.isDefault)
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
      }
    } catch (error) {
      // Failed to load templates
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDate = (days: number) => {
    // Add days to current date and set to end of day (23:59:59)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)
    futureDate.setHours(23, 59, 59, 999)
    setExpiresAt(futureDate.toISOString())
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value // YYYY-MM-DD

    if (!dateValue) {
      setExpiresAt('')
      return
    }

    // User edited the date manually - set expiration to end of that day (23:59:59) in LOCAL timezone
    // Using string constructor creates date in LOCAL timezone (e.g., "2025-10-04T23:59:59.999" in BRT)
    const localEndOfDay = new Date(`${dateValue}T23:59:59.999`)

    setExpiresAt(localEndOfDay.toISOString())
  }

  // Extract YYYY-MM-DD from expiresAt for the DateInput (use LOCAL date parts, not UTC)
  const dateInputValue = expiresAt
    ? (() => {
        const date = new Date(expiresAt)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
    : ''

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      return
    }

    setIsGenerating(true)
    try {
      // Get tenantId from auth store
      const { tenantId } = await import('../../shared/store/auth').then(m => m.useAuthStore.getState())

      if (!tenantId) {
        return
      }

      const payload: any = {
        quoteId,
        templateId: selectedTemplateId,
        tenantId,
        autoGeneratePassword: true // Always generate password
      }

      if (expiresAt) {
        // expiresAt is already an ISO string from handleQuickDate()
        payload.expiresAt = expiresAt
      }

      // Use api directly to capture meta
      const { api } = await import('@client/config/http')
      const response = await api.post('/api/tq/v1/public-quotes', payload)
      
      const publicQuote = response.data
      const meta = response.meta || {}
      
      setGeneratedQuote(publicQuote)
      
      // Notify parent to show LinkToast with URL and password
      if (meta.publicUrl && meta.password && publicQuote.id) {
        onShowToast?.({
          publicQuoteId: publicQuote.id,
          publicUrl: meta.publicUrl,
          password: meta.password
        })
        
        // Close modal after showing toast
        setTimeout(() => {
          onClose()
        }, 500)
      }
      
      onSuccess?.(publicQuote)
    } catch (error) {
      // HTTP interceptor handles feedback automatically - no manual publishFeedback needed
      setGeneratedQuote(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      // Failed to copy
    }
  }

  const handleClose = () => {
    setExpiresAt('')
    setSelectedTemplateId('')
    setGeneratedQuote(null)
    onClose()
  }

  const publicLink = generatedQuote
    ? `${window.location.origin}/public/${generatedQuote.accessToken}`
    : ''

  // Format expiration date for display (use LOCAL date parts)
  const expirationDate = expiresAt
    ? (() => {
        const date = new Date(expiresAt)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      })()
    : t('common:never') || 'Never'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('modals.generate_public_quote.title')}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {t('modals.generate_public_quote.creating_link_for')} <strong>{quoteNumber}</strong>
          </p>
        </DialogHeader>

        {!generatedQuote ? (
          <div className="space-y-6 py-4 px-6">
            {/* Template Selection - Read Only */}
            <div className="space-y-2">
              <Label htmlFor="template">{t('modals.generate_public_quote.select_template')}</Label>
              <Input
                id="template"
                value={templates.find((t) => t.id === selectedTemplateId)?.name || t('common:loading')}
                readOnly
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <DateInput
                id="expiresAt"
                label={t('modals.generate_public_quote.expiration_label')}
                value={dateInputValue}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                helperText={t('modals.generate_public_quote.expiration_helper')}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDate(7)}
                >
                  {t('modals.generate_public_quote.days', { count: 7 })}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDate(30)}
                >
                  {t('modals.generate_public_quote.days', { count: 30 })}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDate(90)}
                >
                  {t('modals.generate_public_quote.days', { count: 90 })}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpiresAt('')}
                >
                  {t('common:never')}
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900">📋 {t('modals.generate_public_quote.summary')}</h4>

              {/* Patient Info */}
              <div className="space-y-1 text-sm border-b border-gray-200 pb-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('common:patient')}:</span>
                  <span className="font-medium">{patientName || '-'}</span>
                </div>
                {patientEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patients.email')}:</span>
                    <span className="font-medium">{patientEmail}</span>
                  </div>
                )}
                {patientPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('patients.phone')}:</span>
                    <span className="font-medium">{patientPhone}</span>
                  </div>
                )}
              </div>

              {/* Link Info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('modals.generate_public_quote.template')}:</span>
                  <span className="font-medium">
                    {templates.find((t) => t.id === selectedTemplateId)?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('modals.generate_public_quote.expiration')}:</span>
                  <span className="font-medium">{expirationDate}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={handleClose} disabled={isGenerating}>
                {t('common:cancel')}
              </Button>
              <Button
                variant="default"
                onClick={handleGenerate}
                disabled={!selectedTemplateId || isGenerating}
                isLoading={isGenerating}
              >
                {isGenerating ? t('modals.generate_public_quote.generating') : t('modals.generate_public_quote.generate_link')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 px-6">
            {/* Success State */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">{t('modals.generate_public_quote.link_created')}</h4>
                <p className="text-sm text-green-700 mt-1">
                  {t('modals.generate_public_quote.share_instruction')}
                </p>
              </div>
            </div>

            {/* Public Link */}
            <div className="space-y-2">
              <Label>{t('modals.generate_public_quote.public_link')}</Label>
              <div className="flex gap-2">
                <Input
                  value={publicLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(publicLink, 'link')}
                  className="flex items-center gap-2"
                >
                  {copiedField === 'link' ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                  {copiedField === 'link' ? t('modals.generate_public_quote.copied') : t('modals.generate_public_quote.copy_link')}
                </Button>
              </div>
            </div>

            {/* Password Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                {t('modals.generate_public_quote.password_warning')}
              </p>
            </div>

            {/* Link Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-900">📋 {t('modals.generate_public_quote.link_details')}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('modals.generate_public_quote.template')}:</span>
                  <span className="font-medium">
                    {templates.find((t) => t.id === generatedQuote.templateId)?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('modals.generate_public_quote.expiration')}:</span>
                  <span className="font-medium">
                    {generatedQuote.expiresAt
                      ? formatShortDate(generatedQuote.expiresAt)
                      : t('common:never')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('common:status')}:</span>
                  <span className="font-medium text-green-600">{t('common:active')}</span>
                </div>
              </div>
            </div>

            {/* Future: Email Button */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                {t('modals.generate_public_quote.coming_soon')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => window.open(publicLink, '_blank')}>
                {t('modals.generate_public_quote.open_link')}
              </Button>
              <Button variant="default" onClick={handleClose}>
                {t('modals.generate_public_quote.done')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
