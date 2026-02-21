import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle } from '@client/common/ui'
import { Mic, UserPlus, List } from 'lucide-react'
import { useAuthStore } from '../../shared/store'
import { consumeSso } from '../../lib/consumeSso'
import { quotesService, Quote } from '../../services/quotes'
import { patientsService, Patient } from '../../services/patients'
import { sessionsService, Session } from '../../services/sessions'
import { clinicalNotesService, ClinicalNote } from '../../services/clinicalNotes'
import { preventionService, Prevention } from '../../services/prevention'
import { landingPagesService, LandingPage, LandingPageTemplate } from '../../services/landingPages'
import { templatesService, Template } from '../../services/templates'
import { QuickActionCard } from '../../components/home/QuickActionCard'
import { SessionCard } from '../../components/home/SessionCard'
import { RecentPatientRow } from '../../components/home/RecentPatientRow'
import { ActivityFeed } from '../../components/home/ActivityFeed'
import { LatestDocumentsSection } from '../../components/home/LatestDocumentsSection'
import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
import { useIsMobile } from '@shared/hooks/use-mobile'

export const Home: React.FC = () => {
  const { t } = useTranslation('tq')
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { formatDateTime } = useDateFormatter()
  const isMobile = useIsMobile(768)

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [reports, setReports] = useState<ClinicalNote[]>([])
  const [prevention, setPrevention] = useState<Prevention[]>([])
  const [publicQuotes, setLandingPages] = useState<LandingPage[]>([])
  const [publicQuoteTemplates, setLandingPageTemplates] = useState<LandingPageTemplate[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  // Generate activity feed from recent data
  const activities = React.useMemo(() => {
    const allActivities: Array<{
      id: string
      type: 'patient_added' | 'session_created' | 'quote_created' | 'report_created' | 'prevention_created' | 'public_quote_created' | 'template_created' | 'public_quote_template_created'
      message: string
      timestamp: string
      icon: 'patient' | 'session' | 'quote' | 'report' | 'prevention' | 'public_quote' | 'template' | 'public_quote_template'
      date: Date
      path?: string
      quoteNumber?: string
    }> = []

    // Add patient activities
    patients.forEach((patient) => {
      allActivities.push({
        id: `patient-${patient.id}`,
        type: 'patient_added',
        message: t('home.activities.patient_added', {
          firstName: patient.first_name,
          lastName: patient.last_name
        }),
        timestamp: formatDateTime(patient.created_at),
        icon: 'patient',
        date: new Date(patient.created_at),
        path: `/patients/${patient.id}/edit`
      })
    })

    // Add session activities
    sessions.forEach((session) => {
      const patientName = session.patient_first_name || session.patient_last_name
        ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
        : t('home.activities.unknown_patient')
      allActivities.push({
        id: `session-${session.id}`,
        type: 'session_created',
        message: t('home.activities.session_created', {
          number: session.number,
          patientName
        }),
        timestamp: formatDateTime(session.created_at),
        icon: 'session',
        date: new Date(session.created_at),
        path: `/sessions/${session.id}/edit`
      })
    })

    // Add quote activities
    quotes.forEach((quote) => {
      const patientName = quote.patient_first_name || quote.patient_last_name
        ? `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim()
        : t('home.activities.unknown_patient')
      allActivities.push({
        id: `quote-${quote.id}`,
        type: 'quote_created',
        message: t('home.activities.quote_created', {
          number: quote.number,
          patientName
        }),
        timestamp: formatDateTime(quote.created_at),
        icon: 'quote',
        date: new Date(quote.created_at),
        path: `/documents/quote/${quote.id}/edit`
      })
    })

    // Add clinical report activities
    reports.forEach((report) => {
      const patientName = report.patient_first_name || report.patient_last_name
        ? `${report.patient_first_name || ''} ${report.patient_last_name || ''}`.trim()
        : t('home.activities.unknown_patient')
      allActivities.push({
        id: `report-${report.id}`,
        type: 'report_created',
        message: t('home.activities.report_created', {
          number: report.number,
          patientName
        }),
        timestamp: formatDateTime(report.created_at),
        icon: 'report',
        date: new Date(report.created_at),
        path: `/documents/clinical-note/${report.id}/edit`
      })
    })

    // Add prevention activities
    prevention.forEach((prev) => {
      const patientName = prev.patient_first_name || prev.patient_last_name
        ? `${prev.patient_first_name || ''} ${prev.patient_last_name || ''}`.trim()
        : t('home.activities.unknown_patient')
      allActivities.push({
        id: `prevention-${prev.id}`,
        type: 'prevention_created',
        message: t('home.activities.prevention_created', {
          number: prev.number,
          patientName
        }),
        timestamp: formatDateTime(prev.createdAt),
        icon: 'prevention',
        date: new Date(prev.createdAt),
        path: `/documents/prevention/${prev.id}/edit`
      })
    })

    // Add landing page activities
    publicQuotes.forEach((pq) => {
      const docNumber = pq.quote?.number || pq.prevention?.number || 'N/A'
      allActivities.push({
        id: `landing-page-${pq.id}`,
        type: 'public_quote_created',
        message: t('home.activities.landing_page_created', { documentNumber: docNumber }),
        timestamp: formatDateTime(pq.createdAt),
        icon: 'public_quote',
        date: new Date(pq.createdAt),
        path: `/landing-pages/links?document=${encodeURIComponent(docNumber)}`,
        quoteNumber: docNumber
      })
    })

    // Add landing page template activities
    publicQuoteTemplates.forEach((pqt) => {
      allActivities.push({
        id: `lp-template-${pqt.id}`,
        type: 'public_quote_template_created',
        message: t('home.activities.lp_template_created', { name: pqt.name }),
        timestamp: formatDateTime(pqt.createdAt),
        icon: 'public_quote_template',
        date: new Date(pqt.createdAt),
        path: `/landing-pages/templates/${pqt.id}/edit`
      })
    })

    // Add template activities
    templates.forEach((template) => {
      allActivities.push({
        id: `template-${template.id}`,
        type: 'template_created',
        message: t('home.activities.template_created', { title: template.title }),
        timestamp: formatDateTime(template.createdAt),
        icon: 'template',
        date: new Date(template.createdAt),
        path: `/templates/${template.id}/edit`
      })
    })

    // Sort by date descending and take top 5
    return allActivities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(({ date, ...rest }) => rest)
  }, [patients, sessions, quotes, reports, prevention, publicQuotes, publicQuoteTemplates, templates, formatDateTime])

  // Handle SSO on home page load
  useEffect(() => {
    const handleSso = async () => {
      try {
        await consumeSso()
      } catch (error) {
        // SSO failed on home page
      }
    }

    handleSso()
  }, [])

  // Load quotes, patients, sessions, reports, public quotes, and templates
  useEffect(() => {
    const loadData = async () => {
      try {
        const [quotesRes, patientsRes, sessionsRes, reportsRes, preventionRes, publicQuotesRes, publicQuoteTemplatesRes, templatesRes] = await Promise.all([
          quotesService.list({}),
          patientsService.list({}),
          sessionsService.list({}),
          clinicalNotesService.list({}),
          preventionService.list({}),
          landingPagesService.listAllLandingPages(),
          landingPagesService.listTemplates({ active: true }),
          templatesService.getAll({})
        ])

        // Sort by created_at DESC and take top items
        const sortedQuotes = quotesRes.data
          .sort((a: Quote, b: Quote) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)

        const sortedPatients = patientsRes.data
          .sort((a: Patient, b: Patient) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        const sortedSessions = sessionsRes.data
          .sort((a: Session, b: Session) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)

        const sortedReports = reportsRes.data
          .sort((a: ClinicalNote, b: ClinicalNote) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6)

        const sortedPrevention = preventionRes.data
          .sort((a: Prevention, b: Prevention) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6)

        const sortedLandingPages = publicQuotesRes
          .sort((a: LandingPage, b: LandingPage) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        const sortedLandingPageTemplates = publicQuoteTemplatesRes.data
          .sort((a: LandingPageTemplate, b: LandingPageTemplate) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        const sortedTemplates = templatesRes.templates
          .sort((a: Template, b: Template) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setQuotes(sortedQuotes)
        setPatients(sortedPatients)
        setSessions(sortedSessions)
        setReports(sortedReports)
        setPrevention(sortedPrevention)
        setLandingPages(sortedLandingPages)
        setLandingPageTemplates(sortedLandingPageTemplates)
        setTemplates(sortedTemplates)
      } catch (error) {
        // Failed to load home data
      } finally {
        setIsLoadingDocuments(false)
        setIsLoadingPatients(false)
        setIsLoadingSessions(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.firstName
            ? `${t('home.welcome_back')}, ${user.firstName}!`
            : `${t('home.welcome_back')}!`
          }
        </h1>
        <p className="text-gray-600 mt-1">{t('app_name')}</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.quick_actions')}</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <QuickActionCard
            icon={Mic}
            title={t('home.start_new_session')}
            onClick={() => navigate('/new-session')}
            colorClass="purple"
          />
          <QuickActionCard
            icon={UserPlus}
            title={t('home.add_patient')}
            onClick={() => navigate('/patients/create')}
            colorClass="pink"
          />
          <QuickActionCard
            icon={List}
            title={t('home.view_sessions')}
            onClick={() => navigate('/sessions')}
            colorClass="blue"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Latest Documents (Quotes, Clinical Notes, Prevention) */}
      <LatestDocumentsSection
        quotes={quotes}
        reports={reports}
        prevention={prevention}
        isLoading={isLoadingDocuments}
      />

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Sessions This Week */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('sessions.this_week')}</h2>
        {isLoadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(isMobile ? sessions.slice(0, 3) : sessions).map((session) => (
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
                {t('sessions.no_sessions_home')}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Two-column layout for Patients and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        {/* Patients Recently Added */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('patients.recently_added')}</h2>
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
                {(isMobile ? patients.slice(0, 3) : patients).map((patient, index) => (
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
                  {t('patients.no_patients_home')}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.recent_activity')}</h2>
          <ActivityFeed
            activities={activities}
            isLoading={isLoadingDocuments || isLoadingPatients || isLoadingSessions}
            onActivityClick={(path) => navigate(path)}
          />
        </div>
      </div>
    </div>
  )
}