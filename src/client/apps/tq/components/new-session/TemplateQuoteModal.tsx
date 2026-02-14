/**
 * Template Quote Modal Component for TQ App
 *
 * Modal component for selecting a template and creating either a quote or clinical report.
 * When used without a sessionId, shows a session selector first.
 * Displays active templates in a dropdown and provides action buttons.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Sparkles, FileText, ChevronLeft, Calendar, User } from 'lucide-react'
import { Modal, Button, Select, Alert, AlertDescription, Input } from '@client/common/ui'
import { templatesService, Template } from '../../services/templates'
import { aiAgentService, FillTemplateRequest } from '../../services/aiAgentService'
import { quotesService, CreateQuoteRequest } from '../../services/quotes'
import { clinicalNotesService, CreateClinicalNoteRequest } from '../../services/clinicalNotes'
import { preventionService, CreatePreventionRequest } from '../../services/prevention'
import { sessionsService, Session } from '../../services/sessions'
import { transcriptionService } from '../../services/transcriptionService'
import { Patient } from '../../services/patients'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

type DocumentType = 'quote' | 'clinical-note' | 'prevention'
type Step = 'session' | 'template'

interface TemplateQuoteModalProps {
  open: boolean
  onClose: () => void
  transcription?: string          // Optional when using session selector
  patient?: Patient | null        // Optional when using session selector
  sessionId?: string              // If provided, skips session selection
  onQuoteCreated?: (quoteId: string, quoteNumber: string) => void
  onClinicalNoteCreated?: (noteId: string, noteNumber: string) => void
  onPreventionCreated?: (preventionId: string, preventionNumber: string) => void
}

export const TemplateQuoteModal: React.FC<TemplateQuoteModalProps> = ({
  open,
  onClose,
  transcription: propTranscription,
  patient: propPatient,
  sessionId: propSessionId,
  onQuoteCreated,
  onClinicalNoteCreated,
  onPreventionCreated
}) => {
  const { t } = useTranslation('tq')
  const { formatShortDate } = useDateFormatter()

  // Session selection state
  const [step, setStep] = useState<Step>('session')
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Template selection state
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [documentType, setDocumentType] = useState<DocumentType>('quote')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Computed values based on step
  const activeSessionId = propSessionId || selectedSessionId
  const activeTranscription = propTranscription || selectedSession?.transcription_text || ''
  // Build patient object from session flat fields
  const activePatient = propPatient || (selectedSession ? {
    id: selectedSession.patient_id,
    first_name: selectedSession.patient_first_name || '',
    last_name: selectedSession.patient_last_name || '',
    email: selectedSession.patient_email || ''
  } : null)

  // Determine initial step when modal opens
  useEffect(() => {
    if (open) {
      if (propSessionId) {
        // If sessionId provided, skip to template step
        setStep('template')
        loadActiveTemplates()
      } else {
        // Otherwise, start with session selection
        setStep('session')
        loadRecentSessions()
      }
      setError(null)
    } else {
      // Reset state when closing
      resetState()
    }
  }, [open, propSessionId])

  const resetState = () => {
    setSelectedSessionId('')
    setSelectedSession(null)
    setSelectedTemplateId('')
    setDocumentType('quote')
    setError(null)
    setSearchQuery('')
  }

  const loadRecentSessions = async () => {
    try {
      setIsLoadingSessions(true)
      setError(null)

      const response = await sessionsService.list({
        limit: 50
      })

      setSessions(response.data || [])
    } catch (error) {
      setError(t('modals.template_quote.failed_to_load_sessions', 'Failed to load sessions'))
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const loadActiveTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await templatesService.getAll({
        active: true,
        limit: 100
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

  const handleSessionSelect = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    setSelectedSessionId(sessionId)
    setSelectedSession(session)

    // Move to template step and load templates
    setStep('template')
    loadActiveTemplates()
  }

  const handleBackToSessions = () => {
    setStep('session')
    setSelectedTemplateId('')
    setError(null)
  }

  const handleCreateDocument = async () => {
    if (!selectedTemplateId || !activeTranscription.trim() || !activePatient) {
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      let targetSessionId: string

      // If sessionId is provided (from EditSession), use it directly
      if (activeSessionId) {
        targetSessionId = activeSessionId
      } else {
        // Otherwise, create new transcription and session (NewSession flow)
        // Step 1: Create transcription from text
        const createdTranscription = await transcriptionService.createTextTranscription(activeTranscription)

        // Step 2: Create session with the transcription
        const sessionData = {
          patient_id: activePatient.id,
          transcription_id: createdTranscription.transcriptionId
        }
        const newSession = await sessionsService.createSession(sessionData)
        targetSessionId = newSession.id
      }

      // Step 3: Fill template with AI using session transcription
      const fillTemplateRequest: FillTemplateRequest = {
        templateId: selectedTemplateId,
        sessionId: targetSessionId,
        patientId: activePatient.id
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
          const newNote = await clinicalNotesService.create(noteData)
          if (onClinicalNoteCreated) {
            onClinicalNoteCreated(newNote.id, newNote.number)
          }
          break
        }
        case 'prevention': {
          const preventionData: CreatePreventionRequest = {
            sessionId: targetSessionId,
            content: filledTemplateResponse.filledTemplate,
            status: 'draft'
          }
          const newPrevention = await preventionService.create(preventionData)
          if (onPreventionCreated) {
            onPreventionCreated(newPrevention.id, newPrevention.number)
          }
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
    resetState()
    onClose()
  }

  // Filter sessions by search query
  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const patientName = `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.toLowerCase()
    const sessionNumber = session.number?.toLowerCase() || ''

    return patientName.includes(query) || sessionNumber.includes(query)
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'session'
        ? t('modals.template_quote.select_session', 'Select Session')
        : t('modals.template_quote.title')
      }
      size="md"
    >
      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'session' ? (
          /* Session Selection Step */
          <>
            {/* Search Input */}
            <div>
              <Input
                placeholder={t('modals.template_quote.search_sessions', 'Search by patient or session number...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sessions List */}
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">
                  {searchQuery
                    ? t('modals.template_quote.no_sessions_found', 'No sessions found')
                    : t('modals.template_quote.no_sessions', 'No sessions available')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.patient_first_name || session.patient_last_name
                              ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
                              : t('common:no_patient', 'No patient')
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            {t('sessions.session')} {session.number}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {session.created_at && formatShortDate(session.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Template Selection Step */
          <>
            {/* Back button when session was selected from list */}
            {!propSessionId && selectedSession && (
              <button
                onClick={handleBackToSessions}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('common:back', 'Back')}
              </button>
            )}

            {/* Selected Session Info */}
            {selectedSession && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedSession.patient_first_name || selectedSession.patient_last_name
                        ? `${selectedSession.patient_first_name || ''} ${selectedSession.patient_last_name || ''}`.trim()
                        : t('common:no_patient', 'No patient')
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('sessions.session')} {selectedSession.number}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
              disabled={!selectedTemplateId || !activeTranscription.trim() || !activePatient || isLoading || isCreating}
              className="w-full flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isCreating ? t('common.loading') : t('modals.template_quote.create_document')}
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
