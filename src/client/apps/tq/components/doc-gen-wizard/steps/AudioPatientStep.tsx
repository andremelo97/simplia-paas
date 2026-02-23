import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Upload, Loader2, Maximize2, Minimize2 } from 'lucide-react'
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
  const [isTranscriptionFullscreen, setIsTranscriptionFullscreen] = useState(false)

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
    <div className="space-y-6">
      {/* Row 1: Audio */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t('doc_gen_wizard.step1.title', 'Record or Upload Audio')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('doc_gen_wizard.step1.description', 'Record a consultation or upload an audio file. The audio will be transcribed automatically.')}
            </p>
          </div>

          {/* Audio mode tabs */}
          {transcriptionStatus === 'idle' && (
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg flex-shrink-0">
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
        </div>

        {/* Audio component */}
        {audioMode === 'record' ? (
          <WizardAudioRecorder />
        ) : (
          <WizardAudioUpload />
        )}

        {/* Transcription preview */}
        {isTranscriptionComplete && transcriptionText && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {t('doc_gen_wizard.step1.transcription_preview', 'Transcription')}
                <span className="text-xs text-gray-400 font-normal ml-2">
                  {transcriptionText.split(/\s+/).length} {t('doc_gen_wizard.step1.words', 'words')}
                </span>
              </h3>
              <button
                onClick={() => setIsTranscriptionFullscreen(true)}
                className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title={t('sessions.expand_transcription', 'Expand')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {transcriptionText.length > 800
                  ? `${transcriptionText.slice(0, 800)}...`
                  : transcriptionText
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Patient */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {t('doc_gen_wizard.step1.patient_title', 'Select Patient')}
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          {t('doc_gen_wizard.step1.patient_description', 'Search for an existing patient or create a new one.')}
        </p>

        <WizardPatientSelector />
      </div>

      {/* Ready indicator + Create session button */}
      {canProceed && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            {t('doc_gen_wizard.step1.ready', 'Audio transcribed and patient selected. Click Next to continue.')}
          </p>
          {!hasSession && (
            <Button
              variant="primary"
              onClick={handleCreateSessionAndAdvance}
              disabled={isCreatingSession}
              className="flex items-center gap-2 flex-shrink-0 ml-4"
            >
              {isCreatingSession && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('doc_gen_wizard.step1.create_session', 'Create Session & Continue')}
            </Button>
          )}
        </div>
      )}

      {/* Fullscreen transcription overlay */}
      {isTranscriptionFullscreen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('sessions.session_transcription', 'Transcription')}
            </h2>
            <button
              onClick={() => setIsTranscriptionFullscreen(false)}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 overflow-y-auto p-6">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-mono">
                {transcriptionText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
