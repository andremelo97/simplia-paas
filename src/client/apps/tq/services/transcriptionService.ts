/**
 * TQ Transcription Service
 *
 * Frontend service for managing audio transcription workflow:
 * 1. Upload audio files (.webm)
 * 2. Start Deepgram transcription
 * 3. Poll for completion status
 * 4. Handle transcription results
 */

import { api } from '../../../config/http'

// Transcription status enum matching backend
export enum TranscriptStatus {
  CREATED = 'created',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// API response types
export interface UploadResponse {
  success: boolean
  transcriptionId: string
  audioUrl: string
  fileName: string
  fileSize: number
  status: TranscriptStatus
}

export interface TranscribeResponse {
  success: boolean
  transcriptionId: string
  requestId: string
  status: TranscriptStatus
  estimatedProcessingTime: number
}

export interface StatusResponse {
  transcriptionId: string
  status: TranscriptStatus
  transcript: string | null
  confidenceScore: number | null
  requestId: string | null
  processingDuration: number | null
  hasAudio: boolean
  createdAt: string
  updatedAt: string
}

export interface TranscriptionError {
  error: string
  details?: string
}

class TranscriptionService {
  private readonly baseUrl = '/api/tq/v1/transcriptions'

  /**
   * Create a text-only transcription (no audio file)
   */
  async createTextTranscription(transcript: string, confidenceScore?: number): Promise<StatusResponse> {
    if (!transcript || !transcript.trim()) {
      throw new Error('Transcript text is required')
    }

    const response = await api.post(this.baseUrl, {
      transcript: transcript.trim(),
      confidence_score: confidenceScore
    })

    if (!response || !response.transcriptionId) {
      throw new Error('Failed to create transcription')
    }

    return {
      transcriptionId: response.transcriptionId,
      status: response.status || TranscriptStatus.COMPLETED,
      transcript: response.transcript,
      confidenceScore: response.confidenceScore || null,
      requestId: null,
      processingDuration: null,
      hasAudio: false,
      createdAt: response.createdAt,
      updatedAt: response.createdAt
    }
  }

  /**
   * Upload audio file for transcription (independent of sessions)
   */
  async uploadAudio(audioFile: File): Promise<UploadResponse> {
    const allowedExtensions = ['.webm', '.mp3', '.mp4', '.wav'];
    const hasValidExtension = allowedExtensions.some(ext =>
      audioFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error('Only .webm, .mp3, .mp4, and .wav audio files are supported')
    }

    if (audioFile.size > 100 * 1024 * 1024) { // 100MB
      throw new Error('File size cannot exceed 100MB')
    }

    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await api.post(
      `${this.baseUrl}/upload`,
      formData,
      {
        headers: {
          // Don't set Content-Type, let browser set it with boundary for multipart
        }
      }
    )

    // HttpClient returns the parsed JSON directly, not response.data
    const data = response

    if (!data || !data.success) {
      throw new Error(data?.error || 'Upload failed')
    }

    return data
  }

  /**
   * Start Deepgram transcription process
   */
  async startTranscription(transcriptionId: string): Promise<TranscribeResponse> {
    const response = await api.post(
      `${this.baseUrl}/${transcriptionId}/transcribe`,
      {} // Empty body
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to start transcription')
    }

    return response
  }

  /**
   * Get transcription status and results
   */
  async getStatus(transcriptionId: string): Promise<StatusResponse> {
    const response = await api.get(`${this.baseUrl}/${transcriptionId}/status`)
    return response
  }

  /**
   * Poll for transcription completion
   * Returns a Promise that resolves when transcription is complete or fails
   */
  async pollForCompletion(
    transcriptionId: string,
    options: {
      maxAttempts?: number
      intervalMs?: number
      onProgress?: (status: StatusResponse) => void
    } = {}
  ): Promise<StatusResponse> {
    const {
      maxAttempts = 60, // 5 minutes with 5s intervals
      intervalMs = 5000, // 5 seconds
      onProgress
    } = options

    let attempts = 0
    console.log(`[transcriptionService] Starting polling for transcriptionId: ${transcriptionId} (max ${maxAttempts} attempts, ${intervalMs}ms interval)`)

    while (attempts < maxAttempts) {
      try {
        console.log(`[transcriptionService] Polling attempt ${attempts + 1}/${maxAttempts}...`)
        const status = await this.getStatus(transcriptionId)
        console.log(`[transcriptionService] Status response:`, status)

        // Call progress callback if provided
        if (onProgress) {
          onProgress(status)
        }

        // Check if transcription is complete
        if (status.status === TranscriptStatus.COMPLETED) {
          console.log('[transcriptionService] ✅ Transcription COMPLETED!')
          return status
        }

        // Check if transcription failed
        if (status.status === TranscriptStatus.FAILED) {
          console.error('[transcriptionService] ❌ Transcription FAILED')
          throw new Error('Transcription failed')
        }

        // Continue polling if still processing
        if (status.status === TranscriptStatus.PROCESSING) {
          console.log(`[transcriptionService] Still PROCESSING, waiting ${intervalMs}ms...`)
          await this.sleep(intervalMs)
          attempts++
          continue
        }

        // Unexpected status
        console.error(`[transcriptionService] ⚠️ Unexpected status: ${status.status}`)
        throw new Error(`Unexpected transcription status: ${status.status}`)

      } catch (error) {
        console.error(`[transcriptionService] Polling error on attempt ${attempts + 1}:`, error)
        if (attempts === maxAttempts - 1) {
          throw error
        }

        // Wait before retrying on error
        await this.sleep(intervalMs)
        attempts++
      }
    }

    console.error(`[transcriptionService] ⏱️ Polling TIMED OUT after ${attempts} attempts`)
    throw new Error('Transcription polling timed out')
  }

  /**
   * Complete transcription workflow: upload → transcribe → poll
   */
  async processAudio(
    audioFile: File,
    options: {
      onUploadComplete?: (transcriptionId: string) => void
      onTranscriptionStarted?: (transcriptionId: string) => void
      onProgress?: (status: StatusResponse) => void
    } = {}
  ): Promise<StatusResponse> {
    console.log('[transcriptionService] Starting processAudio workflow for file:', audioFile.name)
    let transcriptionId: string | null = null

    try {
      // Step 1: Upload audio file
      console.log('[transcriptionService] Step 1: Uploading audio file...')
      const uploadResult = await this.uploadAudio(audioFile)
      transcriptionId = uploadResult.transcriptionId
      console.log('[transcriptionService] Upload successful, transcriptionId:', transcriptionId)

      if (options.onUploadComplete) {
        console.log('[transcriptionService] Calling onUploadComplete callback')
        options.onUploadComplete(transcriptionId)
      }

      // Step 2: Start transcription
      console.log('[transcriptionService] Step 2: Starting transcription...')
      await this.startTranscription(transcriptionId)
      console.log('[transcriptionService] Transcription started successfully')

      if (options.onTranscriptionStarted) {
        console.log('[transcriptionService] Calling onTranscriptionStarted callback')
        options.onTranscriptionStarted(transcriptionId)
      }

      // Step 3: Poll for completion
      console.log('[transcriptionService] Step 3: Starting polling for completion...')
      const result = await this.pollForCompletion(transcriptionId, {
        onProgress: options.onProgress
      })

      console.log('[transcriptionService] ProcessAudio workflow completed successfully')
      return result

    } catch (error) {
      console.error('[transcriptionService] ProcessAudio workflow failed:', error)
      // Mark transcription as failed on any error
      if (transcriptionId) {
        try {
          console.log('[transcriptionService] Marking transcription as failed...')
          await this.markAsFailed(transcriptionId, error instanceof Error ? error.message : 'Unknown error')
        } catch (markFailedError) {
          console.error('Failed to mark transcription as failed:', markFailedError)
        }
      }

      throw error
    }
  }

  /**
   * Mark transcription as failed (for error handling)
   */
  private async markAsFailed(transcriptionId: string, errorMessage: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/${transcriptionId}/mark-failed`, {
        error_message: errorMessage
      })
    } catch (error) {
      console.error('Error marking transcription as failed:', error)
      // Don't throw here to avoid masking the original error
    }
  }

  /**
   * Utility method to sleep for polling intervals
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Format confidence score as percentage
   */
  static formatConfidence(score: number | null): string {
    if (score === null) return 'N/A'
    return `${Math.round(score * 100)}%`
  }

  /**
   * Format processing duration
   */
  static formatDuration(seconds: number | null): string {
    if (seconds === null) return 'N/A'

    if (seconds < 60) {
      return `${seconds}s`
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  /**
   * Get user-friendly status message
   */
  static getStatusMessage(status: TranscriptStatus): string {
    switch (status) {
      case TranscriptStatus.CREATED:
        return 'Ready for audio upload'
      case TranscriptStatus.UPLOADING:
        return 'Uploading audio file...'
      case TranscriptStatus.UPLOADED:
        return 'Audio uploaded, ready to transcribe'
      case TranscriptStatus.PROCESSING:
        return 'Transcribing audio...'
      case TranscriptStatus.COMPLETED:
        return 'Transcription completed'
      case TranscriptStatus.FAILED:
        return 'Transcription failed'
      default:
        return 'Unknown status'
    }
  }
}

export const transcriptionService = new TranscriptionService()
export default transcriptionService