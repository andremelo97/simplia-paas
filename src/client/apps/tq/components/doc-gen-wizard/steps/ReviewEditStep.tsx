import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Receipt, ClipboardList, Shield, Loader2, Save, Maximize2, Minimize2 } from 'lucide-react'
import { Button, TemplateEditor } from '@client/common/ui'
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

  // Read stable fields (don't change while on this step)
  const { documentId, documentNumber, documentType, setDocumentContent, setStep } = useDocGenWizardStore()

  // Read documentContent ONCE to seed local state — don't subscribe to its changes.
  // This prevents the SimpleEditor from re-initializing on every keystroke (TipTap
  // compares content prop vs editor.getHTML() and calls setContent when they differ,
  // which resets the cursor position on complex HTML like quote/prevention templates).
  const initialContent = useRef(useDocGenWizardStore.getState().documentContent || '').current
  const [localContent, setLocalContent] = useState<string>(initialContent)

  const handleContentChange = useCallback((value: string) => {
    setLocalContent(value)
    setDocumentContent(value)
  }, [setDocumentContent])

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)

  // Lock body scroll when maximized
  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMaximized])

  if (!documentType || !documentId) return null

  const config = DOCUMENT_CONFIGS[documentType]
  const Icon = DOC_TYPE_ICONS[documentType]

  const handleSaveAndContinue = async () => {
    if (!localContent || !documentId) return

    setIsSaving(true)
    setError(null)

    try {
      await config.update(documentId, { content: localContent })
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
    <div className="space-y-4 h-full flex flex-col pb-4">
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
          disabled={isSaving || !localContent}
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
          content={localContent}
          onChange={handleContentChange}
          config={config}
          headerAction={
            <button
              onClick={() => setIsMaximized(true)}
              className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title={t('doc_gen_wizard.step3.maximize', 'Expand')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          }
        />
      </div>

      {/* Maximized editor — portal to body so it escapes wizard stacking context */}
      {isMaximized && createPortal(
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0 rounded-t-xl">
              <h2 className="text-sm font-semibold text-gray-900">
                {t(`${config.i18nKey}.content_section`, t('quotes.quote_content'))}
              </h2>
              <button
                onClick={() => setIsMaximized(false)}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title={t('doc_gen_wizard.step3.minimize', 'Minimize')}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-4 template-editor-maximized">
              <TemplateEditor
                content={localContent}
                onChange={handleContentChange}
                placeholder={t(`${config.i18nKey}.placeholders.content`, t('quotes.placeholders.content'))}
                minHeight="100%"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
