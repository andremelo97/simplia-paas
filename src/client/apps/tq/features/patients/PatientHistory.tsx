import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, DollarSign, Stethoscope, Clock, UserPlus, Edit } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Paginator
} from '@client/common/ui'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { quotesService, Quote } from '../../services/quotes'
import { clinicalReportsService, ClinicalReport } from '../../services/clinicalReports'
import { HistoryRow } from '../../components/patients/history/HistoryRow'
import { TimelineItem } from '../../components/patients/history/TimelineItem'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'

// Timeline event type
interface TimelineEvent {
  id: string
  type: 'session' | 'quote' | 'clinical' | 'patient_registered'
  title: string
  preview?: string
  status?: string
  date: string
  timestamp: number
}

export const PatientHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatDateTime } = useDateFormatter()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clinicalReports, setClinicalReports] = useState<ClinicalReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'quotes' | 'clinical' | 'timeline'>('timeline')

  // Pagination state for each tab
  const [sessionsPage, setSessionsPage] = useState(1)
  const [quotesPage, setQuotesPage] = useState(1)
  const [clinicalPage, setClinicalPage] = useState(1)
  const [timelinePage, setTimelinePage] = useState(1)
  const pageSize = 10

  // Metrics calculated from real data
  const metrics = {
    totalSessions: sessions.length,
    totalQuotes: quotes.length,
    approvedQuotes: quotes.filter(q => q.status === 'approved').length,
    totalReports: clinicalReports.length
  }

  // Build timeline events from all data sources - sorted newest first (most recent on top)
  const timelineEvents: TimelineEvent[] = React.useMemo(() => {
    const events: TimelineEvent[] = []

    // Add patient registration event
    if (patient) {
      events.push({
        id: patient.id,
        type: 'patient_registered',
        title: 'Patient Registered',
        preview: `${patient.first_name} ${patient.last_name} was registered in the system`,
        date: formatDateTime(patient.created_at),
        timestamp: new Date(patient.created_at).getTime()
      })
    }

    // Add session events
    sessions.forEach(session => {
      events.push({
        id: session.id,
        type: 'session',
        title: `Session ${session.number}`,
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
        title: `Quote ${quote.number}`,
        preview: quote.content ? quote.content.substring(0, 150) + '...' : `Total: $${quote.total.toFixed(2)}`,
        status: quote.status,
        date: formatDateTime(quote.created_at),
        timestamp: new Date(quote.created_at).getTime()
      })
    })

    // Add clinical report events
    clinicalReports.forEach(report => {
      events.push({
        id: report.id,
        type: 'clinical',
        title: `Clinical Report ${report.number}`,
        preview: report.content ? report.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : undefined,
        date: formatDateTime(report.created_at),
        timestamp: new Date(report.created_at).getTime()
      })
    })

    // Sort newest first (descending by timestamp)
    return events.sort((a, b) => b.timestamp - a.timestamp)
  }, [patient, sessions, quotes, clinicalReports, formatDateTime])

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
        setIsLoading(true)

        // Load patient data
        const patientData = await patientsService.getPatient(id)
        setPatient(patientData)

        // Load sessions, quotes, and clinical reports for this patient
        const [sessionsRes, quotesRes, reportsRes] = await Promise.all([
          sessionsService.list({}),
          quotesService.list({}),
          clinicalReportsService.list({})
        ])

        // Filter by patient_id
        const patientSessions = sessionsRes.data.filter(s => s.patient_id === id)
        const patientQuotes = quotesRes.data.filter(q => q.patient_id === id)
        const patientReports = reportsRes.data.filter(r => r.patient_id === id)

        setSessions(patientSessions)
        setQuotes(patientQuotes)
        setClinicalReports(patientReports)
      } catch (error) {
        console.error('Failed to load patient data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleBack = () => {
    navigate('/patients')
  }

  const patientName = patient
    ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'
    : 'Loading...'

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
          Back to Patients
        </Button>
        <p>Patient not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
          <p className="text-gray-600 mt-1">
            {patientName}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(`/patients/${id}/edit`)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
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
                <p className="text-sm text-gray-600">Total Quotes</p>
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
                <p className="text-sm text-gray-600">Approved Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.approvedQuotes}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#5ED6CE]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalReports}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
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
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'quotes'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quotes
            </button>
            <button
              onClick={() => setActiveTab('clinical')}
              className={`px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === 'clinical'
                  ? 'text-[#B725B7] border-b-2 border-[#B725B7]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Clinical
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
              Timeline
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
                    Showing {Math.min((sessionsPage - 1) * pageSize + 1, sessions.length)} to {Math.min(sessionsPage * pageSize, sessions.length)} of {sessions.length} results
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
                        title={`Session ${session.number}`}
                        preview={session.transcription_text ? session.transcription_text.substring(0, 150) + '...' : undefined}
                        status={session.status}
                        date={formatDateTime(session.created_at)}
                        icon={getEventIcon('session')}
                        viewPath={`/sessions/${session.id}/edit`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No sessions found for this patient
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
                    Showing {Math.min((quotesPage - 1) * pageSize + 1, quotes.length)} to {Math.min(quotesPage * pageSize, quotes.length)} of {quotes.length} results
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
                        title={`Quote ${quote.number}`}
                        preview={`Total: $${quote.total.toFixed(2)}`}
                        status={quote.status}
                        date={formatDateTime(quote.created_at)}
                        icon={getEventIcon('quote')}
                        viewPath={`/quotes/${quote.id}/edit`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No quotes found for this patient
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
              {clinicalReports.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {Math.min((clinicalPage - 1) * pageSize + 1, clinicalReports.length)} to {Math.min(clinicalPage * pageSize, clinicalReports.length)} of {clinicalReports.length} results
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {clinicalReports.length > 0 ? (
                  clinicalReports
                    .slice((clinicalPage - 1) * pageSize, clinicalPage * pageSize)
                    .map((report) => (
                      <HistoryRow
                        key={report.id}
                        id=""
                        type="clinical"
                        title={`Clinical Report ${report.number}`}
                        preview={report.content ? report.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : undefined}
                        date={formatDateTime(report.created_at)}
                        icon={getEventIcon('clinical')}
                        viewPath={`/clinical-reports/${report.id}/view`}
                      />
                    ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No clinical reports found for this patient
                  </div>
                )}
              </div>
              {clinicalReports.length > pageSize && (
                <div className="p-4">
                  <Paginator
                    currentPage={clinicalPage}
                    totalItems={clinicalReports.length}
                    itemsPerPage={pageSize}
                    onPageChange={setClinicalPage}
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
                    Showing {Math.min((timelinePage - 1) * pageSize + 1, timelineEvents.length)} to {Math.min(timelinePage * pageSize, timelineEvents.length)} of {timelineEvents.length} results
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
                              return () => navigate(`/clinical-reports/${event.id}/view`)
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
                    No events found for this patient
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
