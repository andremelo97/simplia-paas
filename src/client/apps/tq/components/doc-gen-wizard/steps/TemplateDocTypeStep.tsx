import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, ClipboardList, Shield, Sparkles, Loader2, FileText } from 'lucide-react'
import { Button, Card } from '@client/common/ui'
import { useDocGenWizardStore, WizardDocumentType } from '../../../shared/store/docGenWizard'
import { templatesService, Template } from '../../../services/templates'
import { aiAgentService, FillTemplateRequest } from '../../../services/aiAgentService'
import { quotesService } from '../../../services/quotes'
import { clinicalNotesService } from '../../../services/clinicalNotes'
import { preventionService } from '../../../services/prevention'

const DOC_TYPE_OPTIONS: { type: WizardDocumentType; icon: typeof Receipt; labelKey: string }[] = [
  { type: 'quote', icon: Receipt, labelKey: 'sidebar.quotes' },
  { type: 'clinical-note', icon: ClipboardList, labelKey: 'sidebar.clinical_notes' },
  { type: 'prevention', icon: Shield, labelKey: 'sidebar.prevention' },
]

export const TemplateDocTypeStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const {
    sessionId,
    sessionNumber,
    patientId,
    patientName,
    selectedTemplateId,
    documentType,
    setTemplate,
    setDocumentType,
    setDocument,
    addCreatedDocument,
    setStep,
  } = useDocGenWizardStore()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await templatesService.getAll({ active: true, limit: 100 })
        setTemplates(response.templates)
      } catch {
        setError(t('doc_gen_wizard.step2.templates_error', 'Failed to load templates'))
      } finally {
        setLoadingTemplates(false)
      }
    }
    loadTemplates()
  }, [t])

  const handleCreateDocument = async () => {
    if (!selectedTemplateId || !sessionId || !documentType) return

    setIsCreating(true)
    setError(null)

    try {
      // Step 1: AI fill template
      const fillRequest: FillTemplateRequest = {
        templateId: selectedTemplateId,
        sessionId: sessionId,
        patientId: patientId || undefined,
      }
      const fillResponse = await aiAgentService.fillTemplate(fillRequest)
      const filledContent = fillResponse.filledTemplate

      // Step 2: Create document based on type
      let docId: string
      let docNumber: string

      switch (documentType) {
        case 'quote': {
          const newQuote = await quotesService.createQuote({
            sessionId,
            content: filledContent,
            status: 'draft',
          })
          docId = newQuote.id
          docNumber = newQuote.number
          break
        }
        case 'clinical-note': {
          const newNote = await clinicalNotesService.create({
            sessionId,
            content: filledContent,
          })
          docId = newNote.id
          docNumber = newNote.number
          break
        }
        case 'prevention': {
          const newPrevention = await preventionService.create({
            sessionId,
            content: filledContent,
            status: 'draft',
          })
          docId = newPrevention.id
          docNumber = newPrevention.number
          break
        }
        default:
          throw new Error('Invalid document type')
      }

      // Store document info
      setDocument(docId, docNumber, filledContent)
      addCreatedDocument({ id: docId, number: docNumber, type: documentType })

      // Advance to review step
      setStep(3)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('doc_gen_wizard.step2.create_error', 'Failed to create document. Please try again.')
      )
    } finally {
      setIsCreating(false)
    }
  }

  const canCreate = !!selectedTemplateId && !!documentType && !isCreating

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {t('doc_gen_wizard.step2.title', 'Select Template & Document Type')}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {t('doc_gen_wizard.step2.description', 'Choose a template and document type. AI will fill the template with the transcription data.')}
        </p>
      </div>

      {/* Session summary card */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-tertiary)]/20 flex items-center justify-center">
            <FileText className="w-5 h-5" style={{ color: 'var(--brand-tertiary)' }} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {sessionNumber && `${t('doc_gen_wizard.step2.session', 'Session')} ${sessionNumber}`}
            </p>
            {patientName && (
              <p className="text-xs text-gray-500">{patientName}</p>
            )}
          </div>
        </div>
      </Card>

      {/* AI Banner */}
      <div className="rounded-lg p-4 bg-gradient-to-r from-[#B725B7]/10 to-[#E91E63]/10 border border-[#B725B7]/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#B725B7] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t('doc_gen_wizard.step2.ai_banner_title', 'AI-Powered Document Generation')}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {t('doc_gen_wizard.step2.ai_banner_description', 'AI will analyze the transcription and intelligently fill the template with relevant information.')}
            </p>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('doc_gen_wizard.step2.template_label', 'Template')}
        </label>
        {loadingTemplates ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t('doc_gen_wizard.step2.loading_templates', 'Loading templates...')}</span>
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            {t('doc_gen_wizard.step2.no_templates', 'No active templates found. Create a template first.')}
          </p>
        ) : (
          <select
            value={selectedTemplateId || ''}
            onChange={(e) => {
              const tmpl = templates.find(t => t.id === e.target.value)
              if (tmpl) setTemplate(tmpl.id, tmpl.title)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#B725B7] focus:ring-1 focus:ring-[#B725B7] outline-none"
          >
            <option value="">{t('doc_gen_wizard.step2.select_template', 'Select a template...')}</option>
            {templates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('doc_gen_wizard.step2.doctype_label', 'Document Type')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DOC_TYPE_OPTIONS.map(({ type, icon: Icon, labelKey }) => {
            const isSelected = documentType === type
            return (
              <button
                key={type}
                onClick={() => setDocumentType(type)}
                className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-[#B725B7] bg-[#B725B7]/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <Icon className={`w-8 h-8 ${isSelected ? 'text-[#B725B7]' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-[#B725B7]' : 'text-gray-700'}`}>
                  {t(labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Document Button */}
      <Button
        variant="primary"
        onClick={handleCreateDocument}
        disabled={!canCreate}
        className="w-full flex items-center justify-center gap-2 py-3"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('doc_gen_wizard.step2.creating', 'Creating document...')}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {t('doc_gen_wizard.step2.create_button', 'Create Document with AI')}
          </>
        )}
      </Button>
    </div>
  )
}
