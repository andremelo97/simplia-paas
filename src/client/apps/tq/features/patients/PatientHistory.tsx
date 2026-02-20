import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, DollarSign, Stethoscope, Clock, UserPlus, Edit, Filter, X, Shield, Share2, Eye, Mic, Receipt, ClipboardList } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Paginator,
  DateInput,
  StatusBadge
} from '@client/common/ui'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { quotesService, Quote } from '../../services/quotes'
import { clinicalNotesService, ClinicalNote } from '../../services/clinicalNotes'
import { preventionService, Prevention } from '../../services/prevention'
import { landingPagesService, LandingPage } from '../../services/landingPages'
import { HistoryRow } from '../../components/patients/history/HistoryRow'
import { TimelineItem } from '../../components/patients/history/TimelineItem'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useDateFilterParams } from '@client/common/utils/dateFilters'

// Timeline event type
interface TimelineEvent {
  id: string
  type: 'session' | 'quote' | 'clinical' | 'prevention' | 'landing_page' | 'patient_registered'
  title: string
  preview?: string
  status?: string
  expiresAt?: string
  date: string
  timestamp: number
}

export const PatientHistory: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatDateTime } = useDateFormatter()
  const { convertDateRange } = useDateFilterParams()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([])
  const [prevention, setPrevention] = useState<Prevention[]>([])
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const isInitialLoad = useRef(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'quotes' | 'clinical' | 'prevention' | 'landing_pages' | 'timeline'>('timeline')

  // Pagination state for each tab
  const [sessionsPage, setSessionsPage] = useState(1)
  const [quotesPage, setQuotesPage] = useState(1)
  const [clinicalPage, setClinicalPage] = useState(1)
  const [preventionPage, setPreventionPage] = useState(1)
  const [landingPagesPage, setLandingPagesPage] = useState(1)
  const [timelinePage, setTimelinePage] = useState(1)
  const pageSize = 10

  // Date filter state
  const [createdFrom, setCreatedFrom] = useState<string>('')
  const [createdTo, setCreatedTo] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Metrics calculated from real data
  const metrics = {
    totalSessions: sessions.length,
    totalQuotes: quotes.length,
    totalReports: clinicalNotes.length,
    totalPrevention: prevention.length,
    totalLandingPages: landingPages.length
  }

  // Build timeline events from all data sources - sorted newest first (most recent on top)
  const timelineEvents: TimelineEvent[] = React.useMemo(() => {
    const events: TimelineEvent[] = []

    // Add patient registration event
    if (patient) {
      events.push({
        id: patient.id,
        type: 'patient_registered',
        title: t('patients.patient_registered'),
        preview: t('patients.history.registered_preview', { name: `${patient.first_name} ${patient.last_name}` }),
        date: formatDateTime(patient.created_at),
        timestamp: new Date(patient.created_at).getTime()
      })
    }

    // Add session events
    sessions.forEach(session => {
      events.push({
        id: session.id,
        type: 'session',
        title: t('patients.history.session_title', { number: session.number }),
        preview: session.transcription_text ? session.transcription_text.substring(0, 150) + '...' : undefined,
        status: session.status,
        date: formatDateTime(session.created_at),
        timestamp: new Date(session.created_at).getTime()
      })
    })

    // Add quote events
    quotes.forEach(quote => {
      events.push({
        id: quote.id,
        type: 'quote',
        title: t('patients.history.quote_title', { number: quote.number }),
        preview: quote.content ? quote.content.substring(0, 150) + '...' : t('patients.history.quote_preview_total', { total: quote.total.toFixed(2) }),
        status: quote.status,
        date: formatDateTime(quote.created_at),
        timestamp: new Date(quote.created_at).getTime()
      })
    })

    // Add clinical note events
    clinicalNotes.forEach(note => {
      events.push({
        id: note.id,
        type: 'clinical',
        title: t('patients.history.clinical_note_title', { number: note.number }),
        preview: note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : undefined,
        date: formatDateTime(note.created_at),
        timestamp: new Date(note.created_at).getTime()
      })
    })

    // Add prevention events
    prevention.forEach(prev => {
      events.push({
        id: prev.id,
        type: 'prevention',
        title: t('patients.history.prevention_title', { number: prev.number }),
        preview: prev.content ? prev.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : undefined,
        status: prev.status,
        date: formatDateTime(prev.createdAt),
        timestamp: new Date(prev.createdAt).getTime()
      })
    })

    // Add landing page events
    landingPages.forEach(lp => {
      const docNumber = lp.quote?.number || lp.prevention?.number || '-'
      const docTypeLabel = lp.documentType === 'prevention' ? t('common.prevention') : t('common.quote')
      events.push({
        id: lp.id,
        type: 'landing_page',
        title: t('patients.history.landing_page_title', { type: docTypeLabel, number: docNumber }),
        status: lp.active ? 'active' : 'revoked',
        expiresAt: lp.expiresAt,
        date: formatDateTime(lp.createdAt),
        timestamp: new Date(lp.createdAt).getTime()
      })
    })

    // Sort newest first (descending by timestamp)
    return events.sort((a, b) => b.timestamp - a.timestamp)
  }, [patient, sessions, quotes, clinicalNotes, prevention, landingPages, formatDateTime])

  const getEventIcon = (type: TimelineEvent['type']) => {
    const iconClasses = "h-10 w-10 rounded-full flex items-center justify-center"

    switch (type) {
      case 'session':
        return (
          <div className={`${iconClasses} bg-purple-100`}>
            <FileText className="w-5 h-5 text-[#B725B7]" />
          </div>
        )
      case 'quote':
        return (
          <div className={`${iconClasses} bg-pink-100`}>
            <DollarSign className="w-5 h-5 text-[#E91E63]" />
          </div>
        )
      case 'clinical':
        return (
          <div className={`${iconClasses} bg-gray-100`}>
            <Stethoscope className="w-5 h-5 text-gray-900" />
          </div>
        )
      case 'prevention':
        return (
          <div className={`${iconClasses} bg-teal-100`}>
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
        )
      case 'landing_page':
        return (
          <div className={`${iconClasses} bg-blue-100`}>
            <Share2 className="w-5 h-5 text-blue-600" />
          </div>
        )
      case 'patient_registered':
        return (
          <div className={`${iconClasses} bg-green-100`}>
            <UserPlus className="w-5 h-5 text-[#5ED6CE]" />
          </div>
        )
      default:
        return (
          <div className={`${iconClasses} bg-gray-100`}>
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
        )
    }
  }

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        if (isInitialLoad.current) {
          setIsLoading(true)
        } else {
          setIsFiltering(true)
        }

        // Load patient data only on initial load
        if (!patient) {
          const patientData = await patientsService.getPatient(id)
          setPatient(patientData)
        }

        // Convert local dates to UTC timestamps using tenant timezone
        const dateParams = convertDateRange(createdFrom || undefined, createdTo || undefined)

        // Build filter params with UTC timestamps
        const filterParams: { created_from?: string; created_to?: string } = {}
        if (dateParams.created_from_utc) filterParams.created_from = dateParams.created_from_utc
        if (dateParams.created_to_utc) filterParams.created_to = dateParams.created_to_utc

        // Load sessions, quotes, clinical reports, prevention and landing pages for this patient
        const [sessionsRes, quotesRes, reportsRes, preventionRes, landingPagesRes] = await Promise.all([
          sessionsService.list(filterParams),
          quotesService.list(filterParams),
          clinicalNotesService.list(filterParams),
          preventionService.list(filterParams),
          landingPagesService.listAllLandingPages(filterParams)
        ])

        // Filter by patient_id
        const patientSessions = sessionsRes.data.filter(s => s.patient_id === id)
        const patientQuotes = quotesRes.data.filter(q => q.patient_id === id)
        const patientReports = reportsRes.data.filter(r => r.patient_id === id)
        const patientPrevention = preventionRes.data.filter(p => p.patient_id === id)
        const patientLandingPages = landingPagesRes.filter(lp =>
          lp.quote?.patient?.id === id || lp.prevention?.patient?.id === id
        )

        setSessions(patientSessions)
        setQuotes(patientQuotes)
        setClinicalNotes(patientReports)
        setPrevention(patientPrevention)
        setLandingPages(patientLandingPages)

        // Reset pagination on filter change
        if (!isInitialLoad.current) {
          setSessionsPage(1)
          setQuotesPage(1)
          setClinicalPage(1)
          setPreventionPage(1)
          setLandingPagesPage(1)
          setTimelinePage(1)
        }
      } catch (error) {
        // Failed to load patient data
      } finally {
        setIsLoading(false)
        setIsFiltering(false)
        isInitialLoad.current = false
      }
    }

    loadData()
  }, [id, createdFrom, createdTo, convertDateRange])

  const handleBack = () => {
    navigate('/patients')
  }

  const patientName = patient
    ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || t('clinical_notes.pages.unknown_patient')
    : t('common:loading')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B725B7]"></div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <Button variant="secondary" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('patients.back_to_list')}
        </Button>
        <p>{t('patients.error_not_found')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.patient_history')}</h1>
          <p className="text-gray-600 mt-1">
            {patientName}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/patients/${id}/edit`)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {t('common:edit')}
        </Button>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#B725B7] transition-colors"
            >
              <Filter className="w-4 h-4" />
              {t('patients.history.filters')}
              {(createdFrom || createdTo) && (
                <span className="bg-[#B725B7] text-white text-xs px-2 py-0.5 rounded-full">
                  {t('patients.history.active')}
                </span>
              )}
            </button>
            {(createdFrom || createdTo) && (
              <button
                onClick={() => {
                  setCreatedFrom('')
                  setCreatedTo('')
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('patients.history.clear_filters')}
              </button>
            )}
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patients.history.created_from')}
                </label>
                <DateInput
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patients.history.created_to')}
                </label>
                <DateInput
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 transition-opacity ${isFiltering ? 'opacity-50' : ''}`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.total_sessions')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalSessions}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#B725B7]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.total_quotes')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalQuotes}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#E91E63]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.total_clinical_notes')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalReports}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('metrics.total_prevention')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalPrevention}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('patients.history.total_landing_pages')}</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalLandingPages}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className={`transition-opacity ${isFiltering ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader className="p-0">
          <div className="flex justify-center border-b border-gray-200">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mic className="w-4 h-4 inline-block mr-1" />
              {t('tabs.sessions')}
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'quotes'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Receipt className="w-4 h-4 inline-block mr-1" />
              {t('tabs.quotes')}
            </button>
            <button
              onClick={() => setActiveTab('clinical')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'clinical'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 inline-block mr-1" />
              {t('tabs.clinical')}
            </button>
            <button
              onClick={() => setActiveTab('prevention')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'prevention'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 inline-block mr-1" />
              {t('tabs.prevention')}
            </button>
            <button
              onClick={() => setActiveTab('landing_pages')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'landing_pages'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Share2 className="w-4 h-4 inline-block mr-1" />
              {t('tabs.landing_pages')}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-1" />
              {t('tabs.timeline')}
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <>
              {/* Top Info - Read-only */}
              {sessions.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('patients.history.showing_results', {
                      from: Math.min((sessionsPage - 1) * pageSize + 1, sessions.length),
                      to: Math.min(sessionsPage * pageSize, sessions.length),
                      total: sessions.length
                    })}
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {sessions.length > 0 ? (
                  sessions
                    .slice((sessionsPage - 1) * pageSize, sessionsPage * pageSize)
                    .map((session) => (
                      <HistoryRow
                        key={session.id}
                        id=""
                        type="session"
                        title={t('patients.history.session_title', { number: session.number })}
                        preview={session.transcription_text ? session.transcription_text.substring(0, 150) + '...' : undefined}
                        status={session.status}
                        date={formatDateTime(session.created_at)}
                        icon={getEventIcon('session')}
                        viewPath={`/sessions/${session.id}/edit`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('patients.history.no_sessions')}
                  </div>
                )}
              </div>
              {sessions.length > pageSize && (
                <div className="p-4">
                  <Paginator
                    currentPage={sessionsPage}
                    totalItems={sessions.length}
                    itemsPerPage={pageSize}
                    onPageChange={setSessionsPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <>
              {/* Top Info - Read-only */}
              {quotes.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('patients.history.showing_results', {
                      from: Math.min((quotesPage - 1) * pageSize + 1, quotes.length),
                      to: Math.min(quotesPage * pageSize, quotes.length),
                      total: quotes.length
                    })}
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {quotes.length > 0 ? (
                  quotes
                    .slice((quotesPage - 1) * pageSize, quotesPage * pageSize)
                    .map((quote) => (
                      <HistoryRow
                        key={quote.id}
                        id=""
                        type="quote"
                        title={t('patients.history.quote_title', { number: quote.number })}
                        preview={t('patients.history.quote_total', { total: quote.total.toFixed(2) })}
                        status={quote.status}
                        date={formatDateTime(quote.created_at)}
                        icon={getEventIcon('quote')}
                        viewPath={`/quotes/${quote.id}/edit`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('patients.history.no_quotes')}
                  </div>
                )}
              </div>
              {quotes.length > pageSize && (
                <div className="p-4">
                  <Paginator
                    currentPage={quotesPage}
                    totalItems={quotes.length}
                    itemsPerPage={pageSize}
                    onPageChange={setQuotesPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Clinical Tab */}
          {activeTab === 'clinical' && (
            <>
              {/* Top Info - Read-only */}
              {clinicalNotes.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('patients.history.showing_results', {
                      from: Math.min((clinicalPage - 1) * pageSize + 1, clinicalNotes.length),
                      to: Math.min(clinicalPage * pageSize, clinicalNotes.length),
                      total: clinicalNotes.length
                    })}
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {clinicalNotes.length > 0 ? (
                  clinicalNotes
                    .slice((clinicalPage - 1) * pageSize, clinicalPage * pageSize)
                    .map((note) => (
                      <HistoryRow
                        key={note.id}
                        id=""
                        type="clinical"
                        title={t('patients.history.clinical_note_title', { number: note.number })}
                        preview={note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : undefined}
                        date={formatDateTime(note.created_at)}
                        icon={getEventIcon('clinical')}
                        viewPath={`/documents/clinical-note/${note.id}/edit`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('patients.history.no_clinical_notes')}
                  </div>
                )}
              </div>
              {clinicalNotes.length > pageSize && (
                <div className="p-4">
                  <Paginator
                    currentPage={clinicalPage}
                    totalItems={clinicalNotes.length}
                    itemsPerPage={pageSize}
                    onPageChange={setClinicalPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Prevention Tab */}
          {activeTab === 'prevention' && (
            <>
              {prevention.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('patients.history.showing_results', {
                      from: Math.min((preventionPage - 1) * pageSize + 1, prevention.length),
                      to: Math.min(preventionPage * pageSize, prevention.length),
                      total: prevention.length
                    })}
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {prevention.length > 0 ? (
                  prevention
                    .slice((preventionPage - 1) * pageSize, preventionPage * pageSize)
                    .map((prev) => (
                      <HistoryRow
                        key={prev.id}
                        id=""
                        type="prevention"
                        title={t('patients.history.prevention_title', { number: prev.number })}
                        preview={prev.content ? prev.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : undefined}
                        status={prev.status}
                        date={formatDateTime(prev.createdAt)}
                        icon={getEventIcon('prevention')}
                        viewPath={`/documents/prevention/${prev.id}/edit`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('patients.history.no_prevention')}
                  </div>
                )}
              </div>
              {prevention.length > pageSize && (
                <div className="p-4">
                  <Paginator
                    currentPage={preventionPage}
                    totalItems={prevention.length}
                    itemsPerPage={pageSize}
                    onPageChange={setPreventionPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Landing Pages Tab */}
          {activeTab === 'landing_pages' && (
            <>
              {landingPages.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('patients.history.showing_results', {
                      from: Math.min((landingPagesPage - 1) * pageSize + 1, landingPages.length),
                      to: Math.min(landingPagesPage * pageSize, landingPages.length),
                      total: landingPages.length
                    })}
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {landingPages.length > 0 ? (
                  landingPages
                    .slice((landingPagesPage - 1) * pageSize, landingPagesPage * pageSize)
                    .map((lp) => {
                      const docNumber = lp.quote?.number || lp.prevention?.number || '-'
                      const docTypeLabel = lp.documentType === 'prevention' ? t('common.prevention') : t('common.quote')
                      const isExpired = lp.expiresAt ? new Date(lp.expiresAt) < new Date() : false

                      return (
                        <div key={lp.id} className="flex items-center justify-between py-3 px-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Share2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{docTypeLabel}: {docNumber}</span>
                                <StatusBadge status={lp.active ? 'active' : 'revoked'} />
                                {isExpired && <StatusBadge status="expired" />}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDateTime(lp.createdAt)}
                                {lp.expiresAt && (
                                  <span className="ml-3">
                                    {t('patients.history.expires')}: {formatDateTime(lp.expiresAt)}
                                  </span>
                                )}
                                <span className="ml-3">{t('patients.history.views')}: {lp.viewsCount}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/landing-pages/links/${lp.id}/preview`, '_blank')}
                            className="flex items-center gap-1.5 flex-shrink-0"
                          >
                            <Eye className="w-4 h-4" />
                            {t('landing_pages.links.card.preview')}
                          </Button>
                        </div>
                      )
                    })
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('patients.history.no_landing_pages')}
                  </div>
                )}
              </div>
              {landingPages.length > pageSize && (
                <div className="p-4">
                  <Paginator
                    currentPage={landingPagesPage}
                    totalItems={landingPages.length}
                    itemsPerPage={pageSize}
                    onPageChange={setLandingPagesPage}
                  />
                </div>
              )}
            </>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <>
              {/* Top Info - Read-only */}
              {timelineEvents.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {t('patients.history.showing_results', {
                      from: Math.min((timelinePage - 1) * pageSize + 1, timelineEvents.length),
                      to: Math.min(timelinePage * pageSize, timelineEvents.length),
                      total: timelineEvents.length
                    })}
                  </p>
                </div>
              )}
              <div className="p-6">
                {timelineEvents.length > 0 ? (
                  <div className="space-y-0">
                    {timelineEvents
                      .slice((timelinePage - 1) * pageSize, timelinePage * pageSize)
                      .map((event, index, array) => {
                        const getViewHandler = () => {
                          switch (event.type) {
                            case 'session':
                              return () => navigate(`/sessions/${event.id}/edit`)
                            case 'quote':
                              return () => navigate(`/quotes/${event.id}/edit`)
                            case 'clinical':
                              return () => navigate(`/documents/clinical-note/${event.id}/edit`)
                            case 'prevention':
                              return () => navigate(`/documents/prevention/${event.id}/edit`)
                            case 'landing_page':
                              return () => window.open(`/landing-pages/links/${event.id}/preview`, '_blank')
                            default:
                              return undefined
                          }
                        }

                        return (
                          <TimelineItem
                            key={`${event.type}-${event.id}-${event.timestamp}`}
                            id=""
                            type={event.type}
                            title={event.title}
                            preview={undefined}
                            status={event.status}
                            expiresAt={event.expiresAt}
                            date={event.date}
                            icon={getEventIcon(event.type)}
                            onView={getViewHandler()}
                            isFirst={index === 0}
                            isLast={index === array.length - 1}
                          />
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {t('patients.history.no_events')}
                  </div>
                )}
              </div>
              {timelineEvents.length > pageSize && (
                <div className="px-6 pb-4">
                  <Paginator
                    currentPage={timelinePage}
                    totalItems={timelineEvents.length}
                    itemsPerPage={pageSize}
                    onPageChange={setTimelinePage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
