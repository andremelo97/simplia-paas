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
  onCreateQuote,
  onCreateClinicalReport,
  onQuoteCreated,
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
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
    if (!selectedTemplateId || !transcription.trim() || !patient) return

    try {
      setIsCreatingQuote(true)
      setError(null)

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

      // Step 3: Fill template with AI using session transcription
      const fillTemplateRequest: FillTemplateRequest = {
        templateId: selectedTemplateId,
        sessionId: newSession.id,
        patientId: patient.id
      }

      console.log('🔮 [TemplateQuoteModal] Filling template with AI:', fillTemplateRequest)
      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)
      console.log('✅ [TemplateQuoteModal] Template filled successfully')

      // Step 4: Create quote with filled template content
      const quoteData: CreateQuoteRequest = {
        sessionId: newSession.id,
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

  const handleCreateClinicalReport = () => {
    if (selectedTemplateId && onCreateClinicalReport) {
      onCreateClinicalReport(selectedTemplateId)
      onClose()
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
              variant="outline"
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
              variant="primary"
              onClick={handleCreateClinicalReport}
              disabled={!selectedTemplateId || isLoading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Clinical Report
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