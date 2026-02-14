/**
 * Template Quote Modal Component for TQ App
 *
 * Modal component for selecting a template and creating either a quote or clinical report.
 * Displays active templates in a dropdown and provides action buttons.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Sparkles, FileText } from 'lucide-react'
import { Modal, Button, Select, Alert, AlertDescription } from '@client/common/ui'
import { templatesService, Template } from '../../services/templates'
import { aiAgentService, FillTemplateRequest } from '../../services/aiAgentService'
import { quotesService, CreateQuoteRequest } from '../../services/quotes'
import { clinicalNotesService, CreateClinicalNoteRequest } from '../../services/clinicalNotes'
import { preventionService, CreatePreventionRequest } from '../../services/prevention'
import { sessionsService } from '../../services/sessions'
import { transcriptionService } from '../../services/transcriptionService'
import { Patient } from '../../services/patients'

type DocumentType = 'quote' | 'clinical-note' | 'prevention'

interface TemplateQuoteModalProps {
  open: boolean
  onClose: () => void
  transcription: string
  patient: Patient | null
  sessionId?: string // Optional: if provided, skips session creation
  onQuoteCreated?: (quoteId: string, quoteNumber: string) => void
}

export const TemplateQuoteModal: React.FC<TemplateQuoteModalProps> = ({
  open,
  onClose,
  transcription,
  patient,
  sessionId,
  onQuoteCreated
}) => {
  const { t } = useTranslation('tq')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [documentType, setDocumentType] = useState<DocumentType>('quote')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load active templates when modal opens
  useEffect(() => {
    if (open) {
      loadActiveTemplates()
    }
  }, [open])

  const loadActiveTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await templatesService.getAll({
        active: true,
        limit: 100 // Get all active templates
      })

      setTemplates(response.templates)

      // Auto-select first template if available
      if (response.templates.length > 0) {
        setSelectedTemplateId(response.templates[0].id)
      }
    } catch (error) {
      setError('Failed to load templates. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDocument = async () => {
    if (!selectedTemplateId || !transcription.trim() || !patient) {
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      let targetSessionId: string

      // If sessionId is provided (from EditSession), use it directly
      if (sessionId) {
        targetSessionId = sessionId
      } else {
        // Otherwise, create new transcription and session (NewSession flow)
        // Step 1: Create transcription from text
        const createdTranscription = await transcriptionService.createTextTranscription(transcription)

        // Step 2: Create session with the transcription
        const sessionData = {
          patient_id: patient.id,
          transcription_id: createdTranscription.transcriptionId
        }
        const newSession = await sessionsService.createSession(sessionData)
        targetSessionId = newSession.id
      }

      // Step 3: Fill template with AI using session transcription
      const fillTemplateRequest: FillTemplateRequest = {
        templateId: selectedTemplateId,
        sessionId: targetSessionId,
        patientId: patient.id
      }

      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)

      // Step 4: Create document based on selected type
      switch (documentType) {
        case 'quote': {
          const quoteData: CreateQuoteRequest = {
            sessionId: targetSessionId,
            content: filledTemplateResponse.filledTemplate,
            status: 'draft'
          }
          const newQuote = await quotesService.createQuote(quoteData)
          if (onQuoteCreated) {
            onQuoteCreated(newQuote.id, newQuote.number)
          }
          break
        }
        case 'clinical-note': {
          const noteData: CreateClinicalNoteRequest = {
            sessionId: targetSessionId,
            content: filledTemplateResponse.filledTemplate
          }
          await clinicalNotesService.create(noteData)
          break
        }
        case 'prevention': {
          const preventionData: CreatePreventionRequest = {
            sessionId: targetSessionId,
            content: filledTemplateResponse.filledTemplate,
            status: 'draft'
          }
          await preventionService.create(preventionData)
          break
        }
      }

      // Success feedback is handled automatically by HTTP interceptor
      onClose()

    } catch (error) {
      setError(error instanceof Error ? error.message : t('modals.template_quote.failed_to_create'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setSelectedTemplateId('')
    setDocumentType('quote')
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('modals.template_quote.title')}
      size="md"
    >
      <div className="p-6 space-y-6">
          {/* AI Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-900">
                  {t('modals.template_quote.ai_banner_title')}
                </h4>
                <p className="text-xs text-purple-700 mt-0.5">
                  {t('modals.template_quote.ai_banner_description')}
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('modals.template_quote.select_template')} *
            </label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">{t('modals.template_quote.no_templates')}</p>
              </div>
            ) : (
              <Select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                placeholder={t('modals.template_quote.select_template')}
                options={templates.map((template) => ({
                  value: template.id,
                  label: template.description
                    ? `${template.title} - ${template.description}`
                    : template.title
                }))}
              />
            )}
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('modals.template_quote.document_type')} *
            </label>
            <Select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              options={[
                { value: 'quote', label: t('modals.template_quote.type_quote') },
                { value: 'clinical-note', label: t('modals.template_quote.type_clinical_note') },
                { value: 'prevention', label: t('modals.template_quote.type_prevention') }
              ]}
            />
          </div>

          {/* Action Button */}
          <Button
            variant="primary"
            onClick={handleCreateDocument}
            disabled={!selectedTemplateId || !transcription.trim() || !patient || isLoading || isCreating}
            className="w-full flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isCreating ? t('common.loading') : t('modals.template_quote.create_document')}
          </Button>
        </div>
    </Modal>
  )
}