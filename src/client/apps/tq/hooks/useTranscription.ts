/**
 * TQ Transcription Hook
 *
 * React hook for managing audio transcription state and workflow.
 * Provides a simple interface for the complete upload → transcribe → poll cycle.
 */

import { useState, useCallback, useRef } from 'react'
import { transcriptionService, TranscriptStatus, StatusResponse } from '../services/transcriptionService'

export interface TranscriptionState {
  // Status
  status: TranscriptStatus
  isProcessing: boolean
  error: string | null

  // Results
  transcript: string | null
  confidenceScore: number | null
  processingDuration: number | null

  // Progress
  progress: {
    uploaded: boolean
    transcribing: boolean
    completed: boolean
  }
}

export interface UseTranscriptionResult {
  state: TranscriptionState
  transcriptionId: string | null
  actions: {
    uploadAndTranscribe: (audioFile: File) => Promise<string>
    checkStatus: (transcriptionId: string) => Promise<void>
    reset: () => void
  }
}

const initialState: TranscriptionState = {
  status: TranscriptStatus.CREATED,
  isProcessing: false,
  error: null,
  transcript: null,
  confidenceScore: null,
  processingDuration: null,
  progress: {
    uploaded: false,
    transcribing: false,
    completed: false
  }
}

export function useTranscription(): UseTranscriptionResult {
  const [state, setState] = useState<TranscriptionState>(initialState)
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Update state helper
  const updateState = useCallback((updates: Partial<TranscriptionState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }))
  }, [])

  // Update progress based on status
  const updateProgress = useCallback((status: TranscriptStatus) => {
    const progress = {
      uploaded: [
        TranscriptStatus.UPLOADED,
        TranscriptStatus.PROCESSING,
        TranscriptStatus.COMPLETED
      ].includes(status),
      transcribing: [
        TranscriptStatus.PROCESSING
      ].includes(status),
      completed: status === TranscriptStatus.COMPLETED
    }

    updateState({ progress })
  }, [updateState])

  // Handle status response
  const handleStatusResponse = useCallback((statusResponse: StatusResponse) => {
    const newState: Partial<TranscriptionState> = {
      status: statusResponse.status,
      transcript: statusResponse.transcript,
      confidenceScore: statusResponse.confidenceScore,
      processingDuration: statusResponse.processingDuration,
      error: statusResponse.status === TranscriptStatus.FAILED
        ? (statusResponse as any).error || (statusResponse as any).message || 'Transcription failed'
        : null
    }

    updateState(newState)
    updateProgress(statusResponse.status)
  }, [updateState, updateProgress])

  // Upload and transcribe audio file
  const uploadAndTranscribe = useCallback(async (audioFile: File): Promise<string> => {
    // Abort any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      updateState({
        isProcessing: true,
        error: null,
        status: TranscriptStatus.UPLOADING,
        progress: { uploaded: false, transcribing: false, completed: false }
      })

      // Process audio with progress callbacks
      const result = await transcriptionService.processAudio(audioFile, {
        onUploadComplete: (newTranscriptionId) => {
          setTranscriptionId(newTranscriptionId)
          updateState({
            status: TranscriptStatus.UPLOADED,
            isProcessing: true, // Keep processing during the entire workflow
            progress: { uploaded: true, transcribing: false, completed: false }
          })
        },

        onTranscriptionStarted: (newTranscriptionId) => {
          setTranscriptionId(newTranscriptionId)
          updateState({
            status: TranscriptStatus.PROCESSING,
            isProcessing: true, // Ensure processing continues
            progress: { uploaded: true, transcribing: true, completed: false }
          })
        },

        onProgress: (statusResponse) => {
          handleStatusResponse(statusResponse)
        }
      })

      // Final result - only stop processing when fully complete
      handleStatusResponse(result)
      updateState({
        isProcessing: false,
        progress: { uploaded: true, transcribing: true, completed: true }
      })

      return result.transcriptionId

    } catch (error) {
      console.error('[Transcription] Upload failed:', error)
      // Extract error message from AppError or generic Error
      const errorMessage = (error as any)?.message || 'Transcription failed'
      updateState({
        isProcessing: false,
        error: errorMessage,
        status: TranscriptStatus.FAILED
      })
      updateProgress(TranscriptStatus.FAILED)
      throw error
    }
  }, [updateState, updateProgress, handleStatusResponse])

  // Check current status
  const checkStatus = useCallback(async (transcriptionId: string) => {
    try {
      const statusResponse = await transcriptionService.getStatus(transcriptionId)
      handleStatusResponse(statusResponse)
    } catch (error) {
      // Extract error message from AppError or generic Error
      const errorMessage = (error as any)?.message || 'Failed to check status'
      updateState({ error: errorMessage })
    }
  }, [handleStatusResponse, updateState])

  // Reset state
  const reset = useCallback(() => {
    // Abort any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setState(initialState)
    setTranscriptionId(null)
  }, [])

  return {
    state,
    transcriptionId,
    actions: {
      uploadAndTranscribe,
      checkStatus,
      reset
    }
  }
}

export default useTranscription