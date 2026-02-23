import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Upload, Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { useDocGenWizardStore } from '../../../shared/store/docGenWizard'
import { WizardAudioRecorder } from '../components/WizardAudioRecorder'
import { WizardAudioUpload } from '../components/WizardAudioUpload'
import { WizardPatientSelector } from '../components/WizardPatientSelector'

type AudioMode = 'record' | 'upload'

export const AudioPatientStep: React.FC = () => {
  const { t } = useTranslation('tq')
  const {
    transcriptionStatus,
    transcriptionText,
    patientId,
    setTranscriptionText,
    resetStep1,
  } = useDocGenWizardStore()

  const [audioMode, setAudioMode] = useState<AudioMode>('record')
  const [isTranscriptionFullscreen, setIsTranscriptionFullscreen] = useState(false)

  // Reset local state when store goes back to idle (wizard was reset)
  React.useEffect(() => {
    if (transcriptionStatus === 'idle') {
      setAudioMode('record')
      setIsTranscriptionFullscreen(false)
    }
  }, [transcriptionStatus])

  const isTranscriptionComplete = transcriptionStatus === 'completed'
  const hasAnyProgress = transcriptionStatus !== 'idle' || !!patientId

  const wordCount = transcriptionText?.trim()
    ? transcriptionText.trim().split(/\s+/).length
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0 h-full">
      {/* Left Column: Patient */}
      <div className="pr-6 border-r border-gray-200">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t('doc_gen_wizard.step1.patient_title', 'Select Patient')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('doc_gen_wizard.step1.patient_description', 'Search for an existing patient or create a new one.')}
            </p>
          </div>

          <WizardPatientSelector />
        </div>
      </div>

      {/* Right Column: Audio & Transcription */}
      <div className="flex flex-col min-h-0 pl-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t('doc_gen_wizard.step1.title', 'Record or Upload Audio')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('doc_gen_wizard.step1.description', 'Record a consultation or upload an audio file. The audio will be transcribed automatically.')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reset button */}
            {hasAnyProgress && (
              <button
                onClick={resetStep1}
                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title={t('sessions.clear_draft', 'Reset')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Audio mode tabs */}
            {transcriptionStatus === 'idle' && (
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
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
        </div>

        {/* Audio component */}
        {audioMode === 'record' ? (
          <WizardAudioRecorder />
        ) : (
          <WizardAudioUpload />
        )}

        {/* Transcription editor — fills remaining space */}
        {isTranscriptionComplete && transcriptionText !== null && (
          <div className="mt-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700">
                {t('doc_gen_wizard.step1.transcription_preview', 'Transcription')}
                {wordCount > 0 && (
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    {wordCount} {t('doc_gen_wizard.step1.words', 'words')}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsTranscriptionFullscreen(true)}
                className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title={t('sessions.expand_transcription', 'Expand')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 relative min-h-0">
              <textarea
                value={transcriptionText}
                onChange={(e) => setTranscriptionText(e.target.value)}
                className="absolute inset-0 w-full h-full resize-none font-mono text-sm leading-relaxed rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#B725B7] focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen transcription overlay */}
      {isTranscriptionFullscreen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('sessions.session_transcription', 'Transcription')}
              {wordCount > 0 && (
                <span className="text-xs text-gray-400 font-normal ml-2">
                  {wordCount} {t('doc_gen_wizard.step1.words', 'words')}
                </span>
              )}
            </h2>
            <button
              onClick={() => setIsTranscriptionFullscreen(false)}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={transcriptionText || ''}
              onChange={(e) => setTranscriptionText(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 resize-none font-mono text-sm leading-relaxed border-0 focus:outline-none focus:ring-0 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}
