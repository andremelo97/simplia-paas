import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Receipt, ClipboardList, Shield, ExternalLink, FilePlus, Info, Minimize2, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@client/common/ui'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useDocGenWizardStore, WizardDocumentType, CreatedDocument } from '../../../shared/store/docGenWizard'
import { quotesService } from '../../../services/quotes'
import { clinicalNotesService } from '../../../services/clinicalNotes'
import { preventionService } from '../../../services/prevention'

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

interface SessionDocument {
  id: string
  number: string
  type: WizardDocumentType
  createdAt: string
  createdBy?: { firstName: string; lastName: string }
}

const PAGE_SIZE = 5

export const CompletionStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const navigate = useNavigate()
  const { formatShortDate } = useDateFormatter()
  const {
    sessionId,
    sessionNumber,
    patientName,
    createdDocuments,
    loopToStep2,
    closeWizard,
    minimizeWizard,
    openWizard,
  } = useDocGenWizardStore()

  const [sessionDocs, setSessionDocs] = useState<SessionDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [page, setPage] = useState(0)

  // Fetch all documents for this session
  useEffect(() => {
    if (!sessionId) return

    const fetchSessionDocs = async () => {
      setIsLoadingDocs(true)
      try {
        const [quotesRes, notesRes, prevRes] = await Promise.all([
          quotesService.list({ sessionId }).catch(() => ({ data: [] })),
          clinicalNotesService.list({ sessionId }).catch(() => ({ data: [] })),
          preventionService.list({ sessionId }).catch(() => ({ data: [] })),
        ])

        const docs: SessionDocument[] = [
          ...quotesRes.data.map(q => ({
            id: q.id,
            number: q.number,
            type: 'quote' as WizardDocumentType,
            createdAt: q.created_at,
            createdBy: q.createdBy,
          })),
          ...notesRes.data.map(n => ({
            id: n.id,
            number: n.number,
            type: 'clinical-note' as WizardDocumentType,
            createdAt: n.created_at,
            createdBy: n.createdBy,
          })),
          ...prevRes.data.map(p => ({
            id: p.id,
            number: p.number,
            type: 'prevention' as WizardDocumentType,
            createdAt: p.createdAt,
            createdBy: p.createdBy,
          })),
        ]

        docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setSessionDocs(docs)
      } catch {
        // ignore
      } finally {
        setIsLoadingDocs(false)
      }
    }

    fetchSessionDocs()
  }, [sessionId, createdDocuments.length])

  const totalPages = Math.max(1, Math.ceil(sessionDocs.length / PAGE_SIZE))
  const pagedDocs = useMemo(
    () => sessionDocs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [sessionDocs, page]
  )

  const handleOpenDocument = (doc: { id: string; type: WizardDocumentType }) => {
    minimizeWizard()
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
    <div className="max-w-2xl mx-auto space-y-6 text-center pb-8">
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

      {/* Session documents list (all docs for this session) */}
      <div className="text-left space-y-2">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          {t('doc_gen_wizard.step4.session_documents_label', 'Session Documents')}
          {!isLoadingDocs && sessionDocs.length > 0 && ` (${sessionDocs.length})`}
        </p>

        {isLoadingDocs ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : sessionDocs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">
            {t('doc_gen_wizard.step4.no_documents', 'No documents found for this session.')}
          </p>
        ) : (
          <>
            {pagedDocs.map((doc) => {
              const Icon = DOC_TYPE_ICONS[doc.type] || Receipt
              const label = t(
                `sidebar.${doc.type === 'clinical-note' ? 'clinical_notes' : doc.type === 'quote' ? 'quotes' : 'prevention'}`,
                DOC_TYPE_LABELS[doc.type]
              )
              const isNew = createdDocuments.some(cd => cd.id === doc.id)
              return (
                <button
                  key={doc.id}
                  onClick={() => handleOpenDocument(doc)}
                  className="w-full flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#B725B7] hover:bg-[#B725B7]/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#B725B7] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.number}</p>
                        {isNew && (
                          <span className="text-[0.625rem] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                            {t('doc_gen_wizard.step4.new_badge', 'new')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {label}
                        {doc.createdBy && ` · ${doc.createdBy.firstName} ${doc.createdBy.lastName}`}
                        {doc.createdAt && ` · ${formatShortDate(doc.createdAt)}`}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#B725B7] flex-shrink-0" />
                </button>
              )
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t('common:previous', 'Previous')}
                </button>
                <span className="text-xs text-gray-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common:next', 'Next')}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
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
          onClick={() => { closeWizard(); openWizard() }}
          className="w-full flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {t('doc_gen_wizard.restart', 'Start Over')}
        </Button>
        <Button
          variant="outline"
          onClick={minimizeWizard}
          className="w-full flex items-center justify-center gap-2"
        >
          <Minimize2 className="w-4 h-4" />
          {t('doc_gen_wizard.minimize', 'Minimize')}
        </Button>
        <Button
          variant="outline"
          onClick={handleCloseWizard}
          className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
        >
          {t('doc_gen_wizard.close_wizard', 'Close Wizard')}
        </Button>
      </div>
    </div>
  )
}
