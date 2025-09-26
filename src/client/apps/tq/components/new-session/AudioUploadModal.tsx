/**
 * Audio Upload Modal Component for TQ App
 *
 * Modal component for uploading audio files with drag & drop support,
 * file validation, and upload progress tracking specifically for TQ sessions.
 */

import React, { useCallback, useRef, useState, DragEvent } from 'react'
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
  const { state, transcriptionId, actions } = useTranscription()
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      actions.reset()
      setIsDragOver(false)
    }
  }, [open, actions])

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
  }, [state.status, state.transcript, transcriptionId, onTranscriptionComplete, onClose])

  // Validate file type and size
  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ACCEPTED_FORMATS.some(format =>
      fileName.endsWith(format.toLowerCase())
    )

    if (!hasValidExtension) {
      return `Invalid file type. Supported formats: ${ACCEPTED_FORMATS.join(', ')}`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_SIZE_MB) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB`
    }

    // Check if it's actually an audio file (basic MIME type check)
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      return 'Selected file is not an audio file'
    }

    return null
  }, [])

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
      title="Upload Audio File"
      description="Select an audio file to upload and transcribe"
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
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <FileAudio className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragOver ? 'Drop audio file here' : 'Upload audio file'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop an audio file, or click to browse
            </p>
            <Button variant="primary" className="mb-2">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            <p className="text-xs text-gray-500">
              Supports: {ACCEPTED_FORMATS.join(', ')} • Max size: {MAX_SIZE_MB}MB
            </p>
          </div>
        )}

        {/* Upload Progress State */}
        {state.isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Loader className="h-5 w-5 animate-spin text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Processing audio file...
                </p>
                <Progress value={state.progress.uploaded ? (state.progress.transcribing ? 75 : 50) : 25} className="h-2 mt-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Please wait while we upload your audio file
            </p>
          </div>
        )}

        {/* Success State */}
        {state.status === 'completed' && (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Upload Complete!</h3>
              <p className="text-gray-600 mt-1">
                Audio transcription completed successfully
              </p>
            </div>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Audio file uploaded successfully. You can now start transcription.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {state.error}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={handleRetry}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Footer - Action Buttons */}
        {state.status === 'created' && !state.isProcessing && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AudioUploadModal