import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@client/common/ui'
import { Mic, UserPlus, List } from 'lucide-react'
import { useAuthStore } from '../../shared/store'
import { consumeSso } from '../../lib/consumeSso'
import { quotesService, Quote } from '../../services/quotes'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { clinicalReportsService, ClinicalReport } from '../../services/clinicalReports'
import { QuickActionCard } from '../../components/home/QuickActionCard'
import { QuoteCard } from '../../components/home/QuoteCard'
import { SessionCard } from '../../components/home/SessionCard'
import { ReportCard } from '../../components/home/ReportCard'
import { RecentPatientRow } from '../../components/home/RecentPatientRow'
import { ActivityFeed } from '../../components/home/ActivityFeed'

export const Home: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [reports, setReports] = useState<ClinicalReport[]>([])
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(true)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingReports, setIsLoadingReports] = useState(true)

  // Generate activity feed from recent data
  const activities = React.useMemo(() => {
    const allActivities: Array<{
      id: string
      type: 'patient_added' | 'session_created' | 'quote_created'
      message: string
      timestamp: string
      icon: 'patient' | 'session' | 'quote'
      date: Date
    }> = []

    // Add patient activities
    patients.forEach((patient) => {
      allActivities.push({
        id: `patient-${patient.id}`,
        type: 'patient_added',
        message: `Patient ${patient.first_name} ${patient.last_name} was added`,
        timestamp: new Date(patient.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        icon: 'patient',
        date: new Date(patient.created_at),
        path: `/patients/${patient.id}/edit`
      })
    })

    // Add session activities
    sessions.forEach((session) => {
      const patientName = session.patient_first_name || session.patient_last_name
        ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
        : 'Unknown Patient'
      allActivities.push({
        id: `session-${session.id}`,
        type: 'session_created',
        message: `Session ${session.number} created for ${patientName}`,
        timestamp: new Date(session.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        icon: 'session',
        date: new Date(session.created_at),
        path: `/sessions/${session.id}/edit`
      })
    })

    // Add quote activities
    quotes.forEach((quote) => {
      const patientName = quote.patient_first_name || quote.patient_last_name
        ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim()
        : 'Unknown Patient'
      allActivities.push({
        id: `quote-${quote.id}`,
        type: 'quote_created',
        message: `Quote ${quote.number} created for ${patientName}`,
        timestamp: new Date(quote.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        icon: 'quote',
        date: new Date(quote.created_at),
        path: `/quotes/${quote.id}/edit`
      })
    })

    // Sort by date descending and take top 5
    return allActivities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(({ date, ...rest }) => rest)
  }, [patients, sessions, quotes])

  // Handle SSO on home page load
  useEffect(() => {
    const handleSso = async () => {
      try {
        console.log('🔄 [TQ Home] Checking for SSO params...')
        const ssoAttempted = await consumeSso()
        if (!ssoAttempted) {
          console.log('ℹ️ [TQ Home] No SSO params found, using persisted session')
        }
      } catch (error) {
        console.error('❌ [TQ Home] SSO failed on home page:', error)
      }
    }

    handleSso()
  }, [])

  // Load quotes, patients, sessions, and reports
  useEffect(() => {
    const loadData = async () => {
      try {
        const [quotesRes, patientsRes, sessionsRes, reportsRes] = await Promise.all([
          quotesService.list({}),
          patientsService.list({}),
          sessionsService.list({}),
          clinicalReportsService.list({})
        ])

        // Sort by created_at DESC and take top items
        const sortedQuotes = quotesRes.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)

        const sortedPatients = patientsRes.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        const sortedSessions = sessionsRes.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)

        const sortedReports = reportsRes.data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)

        setQuotes(sortedQuotes)
        setPatients(sortedPatients)
        setSessions(sortedSessions)
        setReports(sortedReports)
      } catch (error) {
        console.error('Failed to load home data:', error)
      } finally {
        setIsLoadingQuotes(false)
        setIsLoadingPatients(false)
        setIsLoadingSessions(false)
        setIsLoadingReports(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-600 mt-1">TQ - Transcription Quote System</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible">
          <QuickActionCard
            icon={Mic}
            title="Start New Session"
            onClick={() => navigate('/new-session')}
            colorClass="purple"
          />
          <QuickActionCard
            icon={UserPlus}
            title="Add Patient"
            onClick={() => navigate('/patients/create')}
            colorClass="pink"
          />
          <QuickActionCard
            icon={List}
            title="View Sessions"
            onClick={() => navigate('/sessions')}
            colorClass="blue"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Latest Quotes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Quotes</h2>
        {isLoadingQuotes ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : quotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onDoubleClick={() => navigate(`/quotes/${quote.id}/edit`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center py-8">
              <CardTitle className="text-gray-500 text-base font-normal">
                No quotes yet. Start a new session to create your first quote.
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Latest Reports */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Reports</h2>
        {isLoadingReports ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDoubleClick={() => navigate(`/clinical-reports/${report.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center py-8">
              <CardTitle className="text-gray-500 text-base font-normal">
                No clinical reports yet. Create your first report to get started.
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Sessions This Week */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sessions This Week</h2>
        {isLoadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDoubleClick={() => navigate(`/sessions/${session.id}/edit`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="text-center py-8">
              <CardTitle className="text-gray-500 text-base font-normal">
                No sessions yet. Start a new session to get started.
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Two-column layout for Patients and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patients Recently Added */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patients Recently Added</h2>
          {isLoadingPatients ? (
            <Card>
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 animate-pulse" />
                ))}
              </div>
            </Card>
          ) : patients.length > 0 ? (
            <Card>
              <div>
                {patients.map((patient, index) => (
                  <RecentPatientRow
                    key={patient.id}
                    patient={patient}
                    onDoubleClick={() => navigate(`/patients/${patient.id}/edit`)}
                    isLast={index === patients.length - 1}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center py-8">
                <CardTitle className="text-gray-500 text-base font-normal">
                  No patients yet. Add your first patient to get started.
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <ActivityFeed
            activities={activities}
            isLoading={isLoadingQuotes || isLoadingPatients || isLoadingSessions}
            onActivityClick={(path) => navigate(path)}
          />
        </div>
      </div>
    </div>
  )
}