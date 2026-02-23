import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Receipt, ClipboardList, Shield, ExternalLink, FilePlus, Info } from 'lucide-react'
import { Button } from '@client/common/ui'
import { useDocGenWizardStore, WizardDocumentType, CreatedDocument } from '../../../shared/store/docGenWizard'

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

export const CompletionStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()
  const {
    sessionNumber,
    patientName,
    createdDocuments,
    loopToStep2,
    closeWizard,
  } = useDocGenWizardStore()

  const handleOpenDocument = (doc: CreatedDocument) => {
    closeWizard()
    navigate(`/documents/${doc.type}/${doc.id}/edit`)
  }

  const handleCloseWizard = () => {
    const lastDoc = createdDocuments[createdDocuments.length - 1]
    closeWizard()
    if (lastDoc) {
      navigate(`/documents/${lastDoc.type}/${lastDoc.id}/edit`)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center pt-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('doc_gen_wizard.step4.title', 'Document Created!')}
        </h2>
        <p className="text-base text-gray-600 mt-2">
          {t('doc_gen_wizard.step4.description', 'Your document has been created and saved. You can create another document from the same session or close the wizard.')}
        </p>
      </div>

      {/* Session summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
          {t('doc_gen_wizard.step4.session_label', 'Session')}
        </p>
        <p className="text-sm font-medium text-gray-900">{sessionNumber}</p>
        {patientName && (
          <p className="text-sm text-gray-600">{patientName}</p>
        )}
      </div>

      {/* Next steps hint — dynamic per document type */}
      {(() => {
        const types = [...new Set(createdDocuments.map(d => d.type))]
        const hints: { icon: typeof Receipt; text: string }[] = []
        if (types.includes('quote')) {
          hints.push({ icon: Receipt, text: t('doc_gen_wizard.step4.hint_quote', 'Quote: edit content, manage items and prices, generate a public link, and share with your patient via email or WhatsApp.') })
        }
        if (types.includes('clinical-note')) {
          hints.push({ icon: ClipboardList, text: t('doc_gen_wizard.step4.hint_clinical_note', 'Clinical Note: edit content and print or export as PDF.') })
        }
        if (types.includes('prevention')) {
          hints.push({ icon: Shield, text: t('doc_gen_wizard.step4.hint_prevention', 'Prevention: edit content, generate a public link, and share with your patient via email or WhatsApp.') })
        }
        return (
          <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-4 text-left">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#B725B7] flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {t('doc_gen_wizard.step4.next_steps_title', 'What\'s next?')}
                </p>
                {hints.map((hint, i) => {
                  const HintIcon = hint.icon
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <HintIcon className="w-4 h-4 text-[#B725B7] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 leading-relaxed">{hint.text}</p>
                    </div>
                  )
                })}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('doc_gen_wizard.step4.hint_click_to_edit', 'Click on any document below to go to its edit page.')}
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Created documents list */}
      <div className="text-left space-y-2">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          {t('doc_gen_wizard.step4.documents_label', 'Documents Created')}
          {' '}({createdDocuments.length})
        </p>
        {createdDocuments.map((doc) => {
          const Icon = DOC_TYPE_ICONS[doc.type as WizardDocumentType] || Receipt
          const label = DOC_TYPE_LABELS[doc.type as WizardDocumentType] || doc.type
          return (
            <button
              key={doc.id}
              onClick={() => handleOpenDocument(doc)}
              className="w-full flex items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#B725B7] hover:bg-[#B725B7]/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#B725B7]" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 font-mono">{doc.number}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#B725B7]" />
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          variant="primary"
          onClick={loopToStep2}
          className="w-full flex items-center justify-center gap-2"
        >
          <FilePlus className="w-4 h-4" />
          {t('doc_gen_wizard.create_another', 'Create Another Document')}
        </Button>
        <Button
          variant="outline"
          onClick={handleCloseWizard}
          className="w-full"
        >
          {t('doc_gen_wizard.close_wizard', 'Close Wizard')}
        </Button>
      </div>
    </div>
  )
}
