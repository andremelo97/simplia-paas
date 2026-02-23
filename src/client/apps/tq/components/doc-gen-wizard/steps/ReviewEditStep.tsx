import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, ClipboardList, Shield, Loader2, Save } from 'lucide-react'
import { Button } from '@client/common/ui'
import { DocumentContentCard } from '../../../features/documents/components'
import { DOCUMENT_CONFIGS } from '../../../features/documents/documentConfig'
import { useDocGenWizardStore, WizardDocumentType } from '../../../shared/store/docGenWizard'

const DOC_TYPE_ICONS: Record<WizardDocumentType, typeof Receipt> = {
  'quote': Receipt,
  'clinical-note': ClipboardList,
  'prevention': Shield,
}

const DOC_TYPE_LABELS: Record<WizardDocumentType, string> = {
  'quote': 'Quote',
  'clinical-note': 'Clinical Note',
  'prevention': 'Prevention',
}

export const ReviewEditStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const {
    documentId,
    documentNumber,
    documentContent,
    documentType,
    setDocumentContent,
    setStep,
  } = useDocGenWizardStore()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!documentType || !documentId) return null

  const config = DOCUMENT_CONFIGS[documentType]
  const Icon = DOC_TYPE_ICONS[documentType]

  const handleSaveAndContinue = async () => {
    if (!documentContent || !documentId) return

    setIsSaving(true)
    setError(null)

    try {
      await config.update(documentId, { content: documentContent })
      setStep(4)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('doc_gen_wizard.step3.save_error', 'Failed to save document.')
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#B725B7]/10">
            <Icon className="w-4 h-4 text-[#B725B7]" />
            <span className="text-sm font-medium text-[#B725B7]">
              {t(`sidebar.${documentType === 'clinical-note' ? 'clinical_notes' : documentType === 'quote' ? 'quotes' : 'prevention'}`,
                DOC_TYPE_LABELS[documentType]
              )}
            </span>
          </div>
          {documentNumber && (
            <span className="text-sm text-gray-500 font-mono">{documentNumber}</span>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAndContinue}
          disabled={isSaving || !documentContent}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t('doc_gen_wizard.step3.save_continue', 'Save & Continue')}
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        {t('doc_gen_wizard.step3.description', 'Review and edit the AI-generated content. You can make more detailed edits later on the full document page.')}
      </p>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Content Editor */}
      <div className="flex-1 min-h-0">
        <DocumentContentCard
          content={documentContent || ''}
          onChange={setDocumentContent}
          config={config}
        />
      </div>
    </div>
  )
}
