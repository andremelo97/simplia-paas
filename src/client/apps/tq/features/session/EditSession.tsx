import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save, FileText, Download } from 'lucide-react'
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
  LinkToast,
  Tooltip
} from '@client/common/ui'
import { sessionsService, Session } from '../../services/sessions'
import { patientsService, Patient } from '../../services/patients'
import { getSessionStatusColor, getSessionStatusLabel, getSessionStatusOptions, SessionStatus } from '../../types/sessionStatus'
import { TemplateQuoteModal } from '../../components/new-session/TemplateQuoteModal'
import { aiAgentService, FillTemplateRequest } from '../../services/aiAgentService'
import { clinicalNotesService, CreateClinicalNoteRequest } from '../../services/clinicalNotes'
import { useAuthStore } from '../../shared/store'

export const EditSession: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'

  const [session, setSession] = useState<Session | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [transcription, setTranscription] = useState('')
  const [transcriptionError, setTranscriptionError] = useState('')
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.DRAFT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{itemId: string, itemNumber: string, type: 'session' | 'quote' | 'clinical-report'} | null>(null)
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      if (!id) {
        setLoadError('Session ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const sessionData = await sessionsService.getSession(id)

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
            // Failed to load patient data
          }
        }
      } catch (err: any) {

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

    if (!transcription.trim()) {
      setTranscriptionError(t('common:field_required'))
      return
    }

    setTranscriptionError('')

    setIsSubmitting(true)

    try {
      // Update session with new status and transcription text
      const updatedSession = await sessionsService.updateSession(session.id, {
        status: status,
        transcription_text: transcription
      })

      // Update local session data
      setSession(updatedSession)
      // Update transcription state to reflect saved changes
      setTranscription(updatedSession.transcription_text || '')

      // Success feedback is handled automatically by HTTP interceptor
    } catch (err: any) {
      // Error handling is automatic via HTTP interceptor
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
    if (!templateId || !session || !patient) {
      return
    }

    try {
      // Step 1: Fill template with AI using session transcription
      const fillTemplateRequest: FillTemplateRequest = {
        templateId: templateId,
        sessionId: session.id,
        patientId: patient.id
      }

      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)

      // Step 2: Create clinical report with filled template content
      const reportData: CreateClinicalNoteRequest = {
        sessionId: session.id,
        content: filledTemplateResponse.filledTemplate
      }

      const newReport = await clinicalNotesService.create(reportData)

      // Show report link toast
      setToastData({
        itemId: newReport.id,
        itemNumber: newReport.number,
        type: 'clinical-report'
      })
      setShowLinkToast(true)

      // Success feedback is handled automatically by HTTP interceptor
    } catch (error) {
      throw error // Re-throw so TemplateQuoteModal can handle it
    }
  }

  const handleDownloadAudio = async () => {
    if (!session?.id) return

    setIsDownloadingAudio(true)
    try {
      const response = await sessionsService.getAudioDownloadUrl(session.id)
      const { downloadUrl, filename } = response.data

      // Fetch the file as blob to force download instead of opening in new tab
      const audioResponse = await fetch(downloadUrl)
      const blob = await audioResponse.blob()

      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob)

      // Create temporary anchor element and trigger download
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      // Error feedback handled by HTTP interceptor
    } finally {
      setIsDownloadingAudio(false)
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

  // Check if audio is available for download
  // Only show download button if session has transcription_id (audio was uploaded)
  const hasAudioAvailable = Boolean(session.transcription_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sessions.edit')}</h1>
          <p className="text-gray-600 mt-1">
            {t('sessions.session')} {session.number} • {patientName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Download Audio Button - Only show if session has audio upload */}
          {hasAudioAvailable && (
            <Tooltip content={t('sessions.audioDeletedAfter24h')} side="bottom">
              <Button
                type="button"
                variant="tertiary"
                onClick={handleDownloadAudio}
                disabled={isDownloadingAudio}
                isLoading={isDownloadingAudio}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloadingAudio ? t('sessions.downloadingAudio') : t('sessions.downloadAudio')}
              </Button>
            </Tooltip>
          )}

          {/* Create Documents Button - Show if has any transcription text and user can edit */}
          {canEdit && hasTranscription && (
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
                    options={getSessionStatusOptions()}
                    disabled={!canEdit || isSubmitting}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label={t('common.patient')}
                  value={patientName}
                  disabled
                  helperText={t('sessions.helper.associated_patient')}
                />

                <Input
                  label={t('common.created_by')}
                  value={session.createdBy
                    ? `${session.createdBy.firstName || ''} ${session.createdBy.lastName || ''}`.trim()
                    : '—'
                  }
                  disabled
                  helperText={t('common.created_by_helper')}
                />
              </div>
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
                onChange={(e) => {
                  const value = e.target.value
                  setTranscription(value)
                  if (transcriptionError && value.trim()) {
                    setTranscriptionError('')
                  }
                }}
                className="min-h-96 resize-none font-mono"
                helperText={t('sessions.helper_text.edit_transcription')}
                disabled={!canEdit || isSubmitting}
                required
                error={transcriptionError}
              />
            </CardContent>
          </Card>
        </div>

        {canEdit && (
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
        )}
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
