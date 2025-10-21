/**
 * Audio Upload Modal Component for TQ App
 *
 * Modal component for uploading audio files with drag & drop support,
 * file validation, and upload progress tracking specifically for TQ sessions.
 */

import React, { useCallback, useRef, useState, DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { Modal, Button, Progress, Alert, AlertDescription } from '@client/common/ui'
import { useTranscription } from '../../hooks/useTranscription'

interface AudioUploadModalProps {
  open: boolean
  onClose: () => void
  onTranscriptionComplete?: (transcript: string, transcriptionId: string) => void
  className?: string
}


const ACCEPTED_FORMATS = ['.webm', '.mp3', '.mp4', '.wav']
const MAX_SIZE_MB = 100

export const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  open,
  onClose,
  onTranscriptionComplete,
  className = ''
}) => {
  const { t } = useTranslation('tq')
  const { state, transcriptionId, actions } = useTranscription()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens (only on mount or when open changes from false to true)
  const prevOpenRef = React.useRef(open)
  React.useEffect(() => {
    // Only reset when modal transitions from closed to open
    if (open && !prevOpenRef.current) {
      actions.reset()
      setIsDragOver(false)
    }
    prevOpenRef.current = open
  }, [open]) // Removed 'actions' from dependencies to prevent unnecessary resets

  // Handle transcription completion
  React.useEffect(() => {
    if (state.status === 'completed' && state.transcript && transcriptionId && onTranscriptionComplete) {
      // Pass both transcript text and transcriptionId
      onTranscriptionComplete(state.transcript, transcriptionId)

      // Auto-close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    }

    // For empty/short transcripts: keep modal open, show feedback inside
    if (state.status === 'failed_empty_transcript' && state.transcript && transcriptionId && onTranscriptionComplete) {
      // Pass transcript but DO NOT auto-close - user must close manually
      onTranscriptionComplete(state.transcript, transcriptionId)
      // Modal stays open to show info message
    }
  }, [state.status, state.transcript, transcriptionId, onTranscriptionComplete, onClose])

  // Validate file type and size
  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ACCEPTED_FORMATS.some(format =>
      fileName.endsWith(format.toLowerCase())
    )

    if (!hasValidExtension) {
      return t('modals.audio_upload.errors.invalid_type', { formats: ACCEPTED_FORMATS.join(', ') })
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_SIZE_MB) {
      return t('modals.audio_upload.errors.file_too_large', { maxSize: MAX_SIZE_MB })
    }

    // Check if it's actually an audio file (basic MIME type check)
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      return t('modals.audio_upload.errors.not_audio')
    }

    return null
  }, [t])

  // Handle file processing
  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      return
    }

    try {
      await actions.uploadAndTranscribe(file)
      // Modal will auto-close in useEffect when transcription completes
    } catch (error) {
      // Error is already handled by the hook
    }
  }, [validateFile, actions, onClose])

  // Handle file input change
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  // Handle drag & drop
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
    const audioFile = files.find(file =>
      file.type.startsWith('audio/') || file.type.startsWith('video/')
    )

    if (audioFile) {
      processFile(audioFile)
    } else if (files.length > 0) {
      // File dropped but not audio - this should be handled by validation
      console.log('Non-audio file dropped, ignoring')
    }
  }, [processFile])

  // Handle browse button click
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle retry
  const handleRetry = useCallback(() => {
    actions.reset()
  }, [actions])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('modals.audio_upload.title')}
      description={t('modals.audio_upload.upload_instruction')}
      size="md"
      showCloseButton={!state.isProcessing}
    >
      <div className={`p-6 ${className}`}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={state.isProcessing}
        />

        {/* Upload Area - Idle State */}
        {state.status === 'created' && !state.isProcessing && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragOver
                ? 'bg-gray-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            style={isDragOver ? {
              borderColor: 'var(--brand-tertiary)',
              backgroundColor: 'var(--brand-tertiary-bg)'
            } : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <FileAudio className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragOver ? t('modals.audio_upload.drop_here') : t('modals.audio_upload.title')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('modals.audio_upload.upload_instruction')}
            </p>
            <Button variant="primary" className="mb-2">
              <Upload className="w-4 h-4 mr-2" />
              {t('modals.audio_upload.select_file')}
            </Button>
            <p className="text-xs text-gray-500">
              {t('modals.audio_upload.supported_formats')}: {ACCEPTED_FORMATS.join(', ')} • {t('modals.audio_upload.max_size')}: {MAX_SIZE_MB}MB
            </p>
          </div>
        )}

        {/* Upload Progress State */}
        {state.isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--brand-tertiary)' }} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {state.status === 'uploading' && t('modals.audio_upload.uploading')}
                    {state.status === 'uploaded' && t('modals.audio_upload.starting_transcription')}
                    {state.status === 'processing' && t('modals.audio_upload.transcribing')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {state.status === 'uploading' && '33%'}
                    {state.status === 'uploaded' && '66%'}
                    {state.status === 'processing' && '90%'}
                  </p>
                </div>
                <Progress
                  value={
                    state.status === 'uploading' ? 33 :
                    state.status === 'uploaded' ? 66 :
                    state.status === 'processing' ? 90 : 25
                  }
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {state.status === 'uploading' && t('modals.audio_upload.uploading_file')}
                  {state.status === 'uploaded' && t('modals.audio_upload.processing_audio')}
                  {state.status === 'processing' && t('modals.audio_upload.transcription_in_progress')}
                </p>
              </div>
            </div>
            <div className="rounded-lg p-3" style={{
              backgroundColor: 'var(--brand-tertiary-bg)',
              borderColor: 'var(--brand-tertiary)',
              borderWidth: '1px'
            }}>
              <p className="text-xs" style={{ color: 'var(--brand-tertiary-hover)' }}>
                {t('modals.audio_upload.estimated_time')}
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {state.status === 'completed' && (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('modals.audio_upload.upload_complete')}</h3>
              <p className="text-gray-600 mt-1">
                {t('modals.audio_upload.transcription_complete')}
              </p>
            </div>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {t('modals.audio_upload.success_message')}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Empty/Short Transcript Info State */}
        {state.status === 'failed_empty_transcript' && (
          <div className="text-center space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-blue-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('sessions.transcription_warnings.empty_warning_title')}</h3>
              <p
                className="text-gray-600 mt-1 text-sm whitespace-pre-line"
                dangerouslySetInnerHTML={{
                  __html: t('sessions.transcription_warnings.empty_warning_message').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }}
              />
            </div>
            <div className="flex justify-center space-x-3 mt-4">
              <Button variant="primary" onClick={onClose}>
                {t('common:close')}
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-900">
                {state.error}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={handleRetry}>
                {t('common.try_again')}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Footer - Action Buttons */}
        {state.status === 'created' && !state.isProcessing && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AudioUploadModal