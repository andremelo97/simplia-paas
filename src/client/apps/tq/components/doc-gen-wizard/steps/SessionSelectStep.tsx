import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Mic, Loader2, Wand2, FileText, Zap, ArrowRight } from 'lucide-react'
import { Input, Badge, Button, Paginator } from '@client/common/ui'
import { sessionsService, Session } from '../../../services/sessions'
import { useDocGenWizardStore, ExistingSessionData } from '../../../shared/store/docGenWizard'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { getSessionStatusColor } from '../../../types/sessionStatus'
import { formatSessionStatus } from '../../../hooks/useSessions'

export const SessionSelectStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const { startNewSession, selectExistingSession } = useDocGenWizardStore()
  const { formatShortDate } = useDateFormatter()

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    const load = async () => {
      try {
        const response = await sessionsService.list({ limit: 50 })
        setSessions(response.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter(s => {
      const patientName = `${s.patient_first_name || ''} ${s.patient_last_name || ''}`.trim().toLowerCase()
      return s.number.toLowerCase().includes(q) || patientName.includes(q)
    })
  }, [sessions, searchQuery])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const handleSelectSession = (session: Session) => {
    const patientName = `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
    const data: ExistingSessionData = {
      id: session.id,
      number: session.number,
      patientId: session.patient_id,
      patientName,
      transcriptionId: session.transcription_id,
      transcriptionText: session.transcription_text,
    }
    selectExistingSession(data)
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0">
      {/* Left Column: Wizard Introduction */}
      <div className="flex flex-col pr-10 border-r border-gray-200">
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-5" style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}>
              <Wand2 className="w-3.5 h-3.5" />
              {t('doc_gen_wizard.step0.intro_badge', 'Document Wizard')}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {t('doc_gen_wizard.step0.intro_title', 'Generate documents in minutes')}
            </h1>
            <p className="text-base text-gray-500 mt-3 leading-relaxed">
              {t('doc_gen_wizard.step0.intro_description', 'This wizard guides you step by step — from audio to a finished document. It\'s a faster alternative to the manual flow: record, transcribe, pick a template, and let AI do the rest.')}
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Mic className="w-5 h-5 text-[#B725B7]" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {t('doc_gen_wizard.step0.feature_audio', 'Record or upload audio')}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('doc_gen_wizard.step0.feature_audio_desc', 'Transcription is automatic — just speak or upload a file.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#B725B7]" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {t('doc_gen_wizard.step0.feature_ai', 'AI fills your template')}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('doc_gen_wizard.step0.feature_ai_desc', 'Choose a template and the AI generates the document content from the transcription.')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#B725B7]" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">
                  {t('doc_gen_wizard.step0.feature_docs', 'Quotes, notes & prevention')}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('doc_gen_wizard.step0.feature_docs_desc', 'Create multiple document types from a single session.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div className="flex flex-col pl-8">
        {/* New Session Card */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {t('doc_gen_wizard.step0.choose_title', 'How do you want to start?')}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {t('doc_gen_wizard.step0.choose_description', 'Start from scratch or pick an existing session with a transcription already done.')}
          </p>

          <button
            onClick={startNewSession}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-purple-200 hover:border-[#B725B7] hover:bg-purple-50/30 transition-all group text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #B725B7, #E91E63)' }}>
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 group-hover:text-[#B725B7] transition-colors">
                {t('doc_gen_wizard.step0.create_new', 'Create New Session')}
              </p>
              <p className="text-xs text-gray-500">
                {t('doc_gen_wizard.step0.create_new_desc', 'Record audio, select a patient, and generate documents from scratch.')}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#B725B7] transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* Existing Sessions */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {t('doc_gen_wizard.step0.existing_title', 'Or select an existing session')}
            </h3>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('doc_gen_wizard.step0.search_placeholder', 'Search by session number or patient name...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Mic className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchQuery
                    ? t('doc_gen_wizard.step0.no_results', 'No sessions found')
                    : t('doc_gen_wizard.step0.no_sessions', 'No sessions yet. Create your first one!')
                  }
                </p>
              </div>
            ) : (
              <div>
                {paginatedSessions.map((session) => {
                  const patientName = `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim() || '—'
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className="w-full flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-purple-50/50 transition-colors text-left group"
                    >
                      <div className="w-24 flex-shrink-0">
                        <span className="text-xs text-gray-500">{formatShortDate(session.created_at)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 group-hover:text-[#B725B7] transition-colors">
                          {session.number}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-600 truncate block">{patientName}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge className={getSessionStatusColor(session.status)}>
                          {formatSessionStatus(session.status)}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <Paginator
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}
