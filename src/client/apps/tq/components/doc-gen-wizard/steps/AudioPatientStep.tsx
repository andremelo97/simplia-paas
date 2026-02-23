import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Upload, Loader2 } from 'lucide-react'
import { Button } from '@client/common/ui'
import { useDocGenWizardStore } from '../../../shared/store/docGenWizard'
import { sessionsService } from '../../../services/sessions'
import { WizardAudioRecorder } from '../components/WizardAudioRecorder'
import { WizardAudioUpload } from '../components/WizardAudioUpload'
import { WizardPatientSelector } from '../components/WizardPatientSelector'

type AudioMode = 'record' | 'upload'

export const AudioPatientStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const {
    transcriptionStatus,
    transcriptionId,
    transcriptionText,
    patientId,
    sessionId,
    setSession,
    setStep,
  } = useDocGenWizardStore()

  const [audioMode, setAudioMode] = useState<AudioMode>('record')
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const isTranscriptionComplete = transcriptionStatus === 'completed'
  const hasPatient = !!patientId
  const hasSession = !!sessionId
  const canProceed = isTranscriptionComplete && hasPatient && !!transcriptionId

  const handleCreateSessionAndAdvance = async () => {
    if (!canProceed) return

    // If session already exists (e.g., after resume), just advance
    if (hasSession) {
      setStep(1)
      return
    }

    setIsCreatingSession(true)
    try {
      const session = await sessionsService.createSession({
        patient_id: patientId!,
        transcription_id: transcriptionId!,
      })
      setSession(session.id, session.number)
      setStep(1)
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setIsCreatingSession(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Audio */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          {t('doc_gen_wizard.step1.title', 'Record or Upload Audio')}
        </h2>
        <p className="text-sm text-gray-600">
          {t('doc_gen_wizard.step1.description', 'Record a consultation or upload an audio file. The audio will be transcribed automatically.')}
        </p>

        {/* Audio mode tabs */}
        {transcriptionStatus === 'idle' && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => setAudioMode('record')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                audioMode === 'record'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mic className="w-4 h-4" />
              {t('doc_gen_wizard.step1.record_tab', 'Record')}
            </button>
            <button
              onClick={() => setAudioMode('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                audioMode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              {t('doc_gen_wizard.step1.upload_tab', 'Upload')}
            </button>
          </div>
        )}

        {/* Audio component */}
        {audioMode === 'record' ? (
          <WizardAudioRecorder />
        ) : (
          <WizardAudioUpload />
        )}

        {/* Transcription preview */}
        {isTranscriptionComplete && transcriptionText && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t('doc_gen_wizard.step1.transcription_preview', 'Transcription')}
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {transcriptionText.length > 500
                  ? `${transcriptionText.slice(0, 500)}...`
                  : transcriptionText
                }
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {transcriptionText.split(/\s+/).length} {t('doc_gen_wizard.step1.words', 'words')}
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Patient */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          {t('doc_gen_wizard.step1.patient_title', 'Select Patient')}
        </h2>
        <p className="text-sm text-gray-600">
          {t('doc_gen_wizard.step1.patient_description', 'Search for an existing patient or create a new one.')}
        </p>

        <WizardPatientSelector />

        {/* Ready indicator */}
        {canProceed && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              {t('doc_gen_wizard.step1.ready', 'Audio transcribed and patient selected. Click Next to continue.')}
            </p>
          </div>
        )}

        {/* Create session & advance button (duplicated from footer for UX clarity) */}
        {canProceed && !hasSession && (
          <Button
            variant="primary"
            onClick={handleCreateSessionAndAdvance}
            disabled={isCreatingSession}
            className="w-full flex items-center justify-center gap-2 mt-4"
          >
            {isCreatingSession && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('doc_gen_wizard.step1.create_session', 'Create Session & Continue')}
          </Button>
        )}
      </div>
    </div>
  )
}
