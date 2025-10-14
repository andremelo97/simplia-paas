import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save, FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Textarea,
  Badge,
  Alert,
  AlertDescription,
  Select,
  LinkToast
} from '@client/common/ui'
import { sessionsService, Session } from '../../services/sessions'
import { patientsService, Patient } from '../../services/patients'
import { getSessionStatusColor, getSessionStatusLabel, SESSION_STATUS_OPTIONS, SessionStatus } from '../../types/sessionStatus'
import { TemplateQuoteModal } from '../../components/new-session/TemplateQuoteModal'
import { aiAgentService, FillTemplateRequest } from '../../services/aiAgentService'
import { clinicalReportsService, CreateClinicalReportRequest } from '../../services/clinicalReports'

export const EditSession: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [transcription, setTranscription] = useState('')
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.DRAFT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{itemId: string, itemNumber: string, type: 'session' | 'quote' | 'clinical-report'} | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      if (!id) {
        setLoadError('Session ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('📄 [EditSession] Loading session data for ID:', id)
        const sessionData = await sessionsService.getSession(id)
        console.log('✅ [EditSession] Session data loaded:', sessionData)

        setSession(sessionData)
        // Load transcription text if available
        setTranscription(sessionData.transcription_text || '')
        // Load status
        setStatus(sessionData.status as SessionStatus)

        // Load patient data if available
        if (sessionData.patient_id) {
          try {
            const patientData = await patientsService.getPatient(sessionData.patient_id)
            setPatient(patientData)
          } catch (error) {
            console.warn('Failed to load patient data:', error)
          }
        }
      } catch (err: any) {
        console.error('❌ [EditSession] Failed to load session:', err)

        if (err.status === 404) {
          setLoadError('Session not found')
        } else if (err.status >= 500) {
          setLoadError('Server error. Please try again later.')
        } else {
          setLoadError('Failed to load session data. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session || !id) return

    setIsSubmitting(true)

    try {
      console.log('📄 [EditSession] Saving session:', session.id)

      // Update session with new status and transcription text
      const updatedSession = await sessionsService.updateSession(session.id, {
        status: status,
        transcription_text: transcription
      })

      // Update local session data
      setSession(updatedSession)
      // Update transcription state to reflect saved changes
      setTranscription(updatedSession.transcription_text || '')

      console.log('✅ [EditSession] Session updated successfully')
      // Success feedback is handled automatically by HTTP interceptor
    } catch (err: any) {
      console.error('❌ [EditSession] Failed to save session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/sessions')
  }

  const handleBackToList = () => {
    navigate('/sessions')
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const handleStatusChange = (newStatus: SessionStatus) => {
    setStatus(newStatus)
  }

  const handleCreateClinicalReport = async (templateId: string) => {
    console.log('🟣 [EditSession] Create Clinical Report handler called')
    console.log('  - templateId:', templateId)
    console.log('  - sessionId:', session?.id)
    console.log('  - patientId:', patient?.id)

    if (!templateId || !session || !patient) {
      console.log('⚠️ [EditSession] Missing required data for clinical report')
      return
    }

    try {
      // Step 1: Fill template with AI using session transcription
      const fillTemplateRequest: FillTemplateRequest = {
        templateId: templateId,
        sessionId: session.id,
        patientId: patient.id
      }

      console.log('🔮 [EditSession] Filling template with AI:', fillTemplateRequest)
      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)
      console.log('✅ [EditSession] Template filled successfully')

      // Step 2: Create clinical report with filled template content
      const reportData: CreateClinicalReportRequest = {
        sessionId: session.id,
        content: filledTemplateResponse.filledTemplate
      }

      console.log('📋 [EditSession] Creating clinical report with filled template')
      const newReport = await clinicalReportsService.create(reportData)
      console.log('✅ [EditSession] Clinical report created successfully:', newReport.number)

      // Show report link toast
      setToastData({
        itemId: newReport.id,
        itemNumber: newReport.number,
        type: 'clinical-report'
      })
      setShowLinkToast(true)

      // Success feedback is handled automatically by HTTP interceptor
    } catch (error) {
      console.error('❌ [EditSession] Failed to create clinical report:', error)
      throw error // Re-throw so TemplateQuoteModal can handle it
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sessions.edit')}</h1>
          <p className="text-gray-600 mt-1">{t('sessions.loading_session')}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B725B7]"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sessions.edit')}</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert" aria-live="assertive">
          <div className="flex items-center">
            <div className="text-red-800">
              <h3 className="font-medium">{t('sessions.error_loading')}</h3>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <Button variant="secondary" onClick={handleBackToList}>
              {t('sessions.back_to_list')}
            </Button>
            <Button variant="default" onClick={handleRetry}>
              {t('common.retry')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sessions.edit')}</h1>
        </div>
        <Alert>
          <AlertDescription>
            {t('sessions.session_not_found')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const patientName = session.patient_first_name || session.patient_last_name
    ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
    : t('sessions.unknown_patient')

  const hasTranscription = Boolean(transcription && transcription.trim().length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sessions.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('sessions.session')} {session.number} • {patientName}
          </p>
        </div>

        {hasTranscription && (
          <Button
            variant="primary"
            onClick={() => setShowTemplateModal(true)}
            disabled={isSubmitting}
          >
            <FileText className="w-4 h-4 mr-2" />
            {t('sessions.create_documents')}
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Session Details */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('sessions.session_details')}</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('sessions.number')}
                  value={session.number}
                  disabled
                  helperText={t('sessions.helper.session_number')}
                />

                <div>
                  <Select
                    label={t('common.status')}
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as SessionStatus)}
                    options={SESSION_STATUS_OPTIONS}
                    disabled={isSubmitting}
                    helperText={t('sessions.helper.current_status')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('common.created_at')}
                  value={new Date(session.created_at).toLocaleString()}
                  disabled
                  helperText={t('sessions.helper.created_at')}
                />

                <Input
                  label={t('sessions.last_updated')}
                  value={new Date(session.updated_at).toLocaleString()}
                  disabled
                  helperText={t('sessions.helper.updated_at')}
                />
              </div>

              <Input
                label={t('common.patient')}
                value={patientName}
                disabled
                helperText={t('sessions.helper.associated_patient')}
              />
            </CardContent>
          </Card>

          {/* Transcription */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('sessions.transcription')}</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <Textarea
                label={t('sessions.transcription_content')}
                placeholder={t('sessions.placeholders.transcription_edit')}
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="min-h-96 resize-none font-mono"
                helperText={t('sessions.helper_text.edit_transcription')}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('sessions.saving_changes') : t('common.save_changes')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ height: '32px', minHeight: '32px' }}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>

      {/* Template Quote Modal */}
      <TemplateQuoteModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        transcription={transcription}
        patient={patient}
        sessionId={session.id}
        onQuoteCreated={(quoteId, quoteNumber) => {
          setShowTemplateModal(false)
          // Show quote link toast
          setToastData({
            itemId: quoteId,
            itemNumber: quoteNumber,
            type: 'quote'
          })
          setShowLinkToast(true)
        }}
        onCreateClinicalReport={handleCreateClinicalReport}
      />

      {/* Quote Link Toast */}
      {toastData && (
        <LinkToast
          show={showLinkToast}
          itemNumber={toastData.itemNumber}
          itemId={toastData.itemId}
          onClose={() => setShowLinkToast(false)}
          type={toastData.type}
        />
      )}
    </div>
  )
}