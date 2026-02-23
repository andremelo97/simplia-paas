import React, { useCallback, useRef, useState, DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileAudio, AlertCircle } from 'lucide-react'
import { Button } from '@client/common/ui'
import { useTranscription } from '../../../hooks/useTranscription'
import { useDocGenWizardStore } from '../../../shared/store/docGenWizard'
import { WizardTranscriptionProgress } from './WizardTranscriptionProgress'

const ACCEPTED_FORMATS = ['.webm', '.mp3', '.mp4', '.wav']
const MAX_SIZE_MB = 100

export const WizardAudioUpload: React.FC = () => {
  const { t } = useTranslation('tq')
  const { transcriptionStatus, setTranscription, setTranscriptionStatus } = useDocGenWizardStore()
  const { state, actions } = useTranscription()

  const [isDragOver, setIsDragOver] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ACCEPTED_FORMATS.some(format => fileName.endsWith(format))
    if (!hasValidExtension) {
      return t('modals.audio_upload.errors.invalid_type', { formats: ACCEPTED_FORMATS.join(', ') })
    }
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_SIZE_MB) {
      return t('modals.audio_upload.errors.file_too_large', { maxSize: MAX_SIZE_MB })
    }
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      return t('modals.audio_upload.errors.not_audio')
    }
    return null
  }, [t])

  const processFile = useCallback(async (file: File) => {
    setValidationError(null)
    const error = validateFile(file)
    if (error) {
      setValidationError(error)
      return
    }

    try {
      setTranscriptionStatus('uploading')
      const transcriptionId = await actions.uploadAndTranscribe(file)
      // The hook handles status updates; we sync with wizard store on completion
    } catch {
      setTranscriptionStatus('error')
    }
  }, [validateFile, actions, setTranscriptionStatus])

  // Sync useTranscription hook state with wizard store
  React.useEffect(() => {
    if (state.status === 'uploading') {
      setTranscriptionStatus('uploading')
    } else if (state.status === 'processing') {
      setTranscriptionStatus('processing')
    } else if (state.status === 'completed' && state.transcript) {
      setTranscription(
        // transcriptionId comes from the hook's state
        state.transcript ? String(state.transcript) : '',
        state.transcript
      )
    } else if (state.error) {
      setTranscriptionStatus('error')
    }
  }, [state.status, state.transcript, state.error, setTranscription, setTranscriptionStatus])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    const audioFile = files.find(f => f.type.startsWith('audio/') || f.type.startsWith('video/'))
    if (audioFile) processFile(audioFile)
  }, [processFile])

  const isProcessing = ['uploading', 'processing'].includes(transcriptionStatus)
  const isCompleted = transcriptionStatus === 'completed'
  const isIdle = transcriptionStatus === 'idle'

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Drop zone - only when idle */}
      {isIdle && (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragOver
                ? 'bg-gray-50'
                : validationError
                  ? 'border-red-300 hover:border-red-400'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            style={isDragOver ? {
              borderColor: 'var(--brand-tertiary)',
              backgroundColor: 'var(--brand-tertiary-bg)'
            } : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileAudio className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">
              {isDragOver
                ? t('modals.audio_upload.drop_here', 'Drop audio file here')
                : t('doc_gen_wizard.audio.upload_title', 'Upload Audio File')
              }
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {t('doc_gen_wizard.audio.upload_instruction', 'Drag & drop an audio file or click to browse')}
            </p>
            <Button variant="primary" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              {t('modals.audio_upload.select_file', 'Select File')}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              {ACCEPTED_FORMATS.join(', ')} &bull; Max {MAX_SIZE_MB}MB
            </p>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{validationError}</span>
            </div>
          )}
        </>
      )}

      {/* Progress */}
      {(isProcessing || transcriptionStatus === 'error') && (
        <WizardTranscriptionProgress status={transcriptionStatus} error={state.error} />
      )}
    </div>
  )
}
