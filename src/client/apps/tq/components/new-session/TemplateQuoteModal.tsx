/**
 * Template Quote Modal Component for TQ App
 *
 * Modal component for selecting a template and creating either a quote or clinical report.
 * Displays active templates in a dropdown and provides action buttons.
 */

import React, { useState, useEffect } from 'react'
import { FileText, Receipt, Loader2 } from 'lucide-react'
import { Modal, Button, Select, Alert, AlertDescription } from '@client/common/ui'
import { templatesService, Template } from '../../services/templates'
import { aiAgentService, FillTemplateRequest } from '../../services/aiAgentService'
import { quotesService, CreateQuoteRequest } from '../../services/quotes'
import { sessionsService } from '../../services/sessions'
import { transcriptionService } from '../../services/transcriptionService'
import { Patient } from '../../services/patients'

interface TemplateQuoteModalProps {
  open: boolean
  onClose: () => void
  transcription: string
  patient: Patient | null
  sessionId?: string // Optional: if provided, skips session creation
  onCreateQuote?: (templateId: string) => void
  onCreateClinicalReport?: (templateId: string) => void
  onQuoteCreated?: (quoteId: string, quoteNumber: string) => void
  className?: string
}

export const TemplateQuoteModal: React.FC<TemplateQuoteModalProps> = ({
  open,
  onClose,
  transcription,
  patient,
  sessionId,
  onCreateQuote,
  onCreateClinicalReport,
  onQuoteCreated,
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [isCreatingClinicalReport, setIsCreatingClinicalReport] = useState(false)
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
      console.error('Failed to load templates:', error)
      setError('Failed to load templates. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuote = async () => {
    console.log('🟣 [TemplateQuoteModal] Create Quote button clicked')
    console.log('  - templateId:', selectedTemplateId)
    console.log('  - transcription:', transcription ? transcription.substring(0, 50) : 'none')
    console.log('  - patient:', patient?.id)

    if (!selectedTemplateId || !transcription.trim() || !patient) {
      console.log('⚠️ [TemplateQuoteModal] Validation failed - missing required data')
      return
    }

    try {
      setIsCreatingQuote(true)
      setError(null)

      let targetSessionId: string

      // If sessionId is provided (from EditSession), use it directly
      if (sessionId) {
        targetSessionId = sessionId
        console.log('📄 [TemplateQuoteModal] Using existing session:', sessionId)
      } else {
        // Otherwise, create new transcription and session (NewSession flow)
        // Step 1: Create transcription from text
        console.log('📝 [TemplateQuoteModal] Creating transcription with text:', transcription)
        const createdTranscription = await transcriptionService.createTextTranscription(transcription)
        console.log('✅ [TemplateQuoteModal] Transcription created:', createdTranscription.transcriptionId)

        // Step 2: Create session with the transcription
        console.log('📄 [TemplateQuoteModal] Creating session for patient:', patient.id)
        const sessionData = {
          patient_id: patient.id,
          transcription_id: createdTranscription.transcriptionId
        }
        const newSession = await sessionsService.createSession(sessionData)
        console.log('✅ [TemplateQuoteModal] Session created successfully:', newSession.number)
        targetSessionId = newSession.id
      }

      // Step 3: Fill template with AI using session transcription
      const fillTemplateRequest: FillTemplateRequest = {
        templateId: selectedTemplateId,
        sessionId: targetSessionId,
        patientId: patient.id
      }

      console.log('🔮 [TemplateQuoteModal] Filling template with AI:', fillTemplateRequest)
      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)
      console.log('✅ [TemplateQuoteModal] Template filled successfully')

      // Step 4: Create quote with filled template content
      const quoteData: CreateQuoteRequest = {
        sessionId: targetSessionId,
        content: filledTemplateResponse.filledTemplate,
        status: 'draft'
      }

      console.log('💰 [TemplateQuoteModal] Creating quote with filled template')
      const newQuote = await quotesService.createQuote(quoteData)
      console.log('✅ [TemplateQuoteModal] Quote created successfully:', newQuote.number)

      // Call the callback to show toast in NewSession
      if (onQuoteCreated) {
        onQuoteCreated(newQuote.id, newQuote.number)
      }

      // Success feedback is handled automatically by HTTP interceptor
      onClose()

    } catch (error) {
      console.error('❌ [TemplateQuoteModal] Failed to create quote with template:', error)
      setError(error instanceof Error ? error.message : 'Failed to create quote from template')
    } finally {
      setIsCreatingQuote(false)
    }
  }

  const handleCreateClinicalReport = async () => {
    console.log('🟣 [TemplateQuoteModal] Create Clinical Report button clicked')
    console.log('  - templateId:', selectedTemplateId)
    console.log('  - onCreateClinicalReport callback:', onCreateClinicalReport ? 'exists' : 'missing')

    if (!selectedTemplateId || !onCreateClinicalReport) {
      console.log('⚠️ [TemplateQuoteModal] Cannot create - missing template or callback')
      return
    }

    try {
      setIsCreatingClinicalReport(true)
      setError(null)

      // Call the parent handler and wait for it to complete
      await onCreateClinicalReport(selectedTemplateId)

      // Close modal after successful creation
      onClose()
    } catch (error) {
      console.error('❌ [TemplateQuoteModal] Failed to create clinical report:', error)
      setError(error instanceof Error ? error.message : 'Failed to create clinical report')
    } finally {
      setIsCreatingClinicalReport(false)
    }
  }

  const handleClose = () => {
    setSelectedTemplateId('')
    setError(null)
    onClose()
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create from Template"
      size="md"
      className={className}
    >
      <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Template *
            </label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No active templates available</p>
                <p className="text-xs text-gray-400 mt-1">
                  Create templates first to use this feature
                </p>
              </div>
            ) : (
              <Select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                placeholder="Choose a template..."
                options={templates.map((template) => ({
                  value: template.id,
                  label: template.title
                }))}
              />
            )}
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {selectedTemplate.title}
              </h4>
              {selectedTemplate.description && (
                <p className="text-xs text-gray-600 mb-2">
                  {selectedTemplate.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Used {selectedTemplate.usageCount} times
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={handleCreateQuote}
              disabled={!selectedTemplateId || !transcription.trim() || !patient || isLoading || isCreatingQuote}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isCreatingQuote ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              {isCreatingQuote ? 'Creating Quote...' : 'Create Quote'}
            </Button>

            <Button
              variant="outline"
              onClick={handleCreateClinicalReport}
              disabled={!selectedTemplateId || isLoading || isCreatingQuote || isCreatingClinicalReport}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isCreatingClinicalReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {isCreatingClinicalReport ? 'Creating Clinical Report...' : 'Create Clinical Report'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 text-center">
            Select a template to create a quote or clinical report with pre-filled content
          </div>
        </div>
    </Modal>
  )
}