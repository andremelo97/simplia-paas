import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Pause, Play } from 'lucide-react'
import { Button } from '@client/common/ui'
import { useTranscription } from '../../../hooks/useTranscription'
import { useDocGenWizardStore } from '../../../shared/store/docGenWizard'
import { transcriptionService } from '../../../services/transcriptionService'
import { WizardTranscriptionProgress } from './WizardTranscriptionProgress'

// Timer hook (same pattern as NewSession.tsx)
function useTimer() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isRunning])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => { setTime(0); setIsRunning(false) }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return { time, isRunning, start, pause, reset, formatTime }
}

export const WizardAudioRecorder: React.FC = () => {
  const { t } = useTranslation('tq')
  const {
    transcriptionStatus,
    setTranscription,
    setTranscriptionStatus,
  } = useDocGenWizardStore()

  const timer = useTimer()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })

      audioStreamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)
      setTranscriptionStatus('recording')
      timer.start()
    } catch {
      setError(t('doc_gen_wizard.audio.mic_error', 'Failed to access microphone. Please check permissions.'))
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      timer.pause()
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timer.start()
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!

      mediaRecorder.onstop = async () => {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop())
          audioStreamRef.current = null
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const durationSeconds = timer.time

        if (audioBlob.size === 0) {
          setError(t('doc_gen_wizard.audio.empty_recording', 'No audio data captured. Please try again.'))
          resetRecordingState()
          resolve()
          return
        }

        if (durationSeconds < 60) {
          const mins = Math.floor(durationSeconds / 60)
          const secs = durationSeconds % 60
          setError(t('sessions.recording.too_short', {
            duration: `${mins}:${secs.toString().padStart(2, '0')}`
          }))
          resetRecordingState()
          resolve()
          return
        }

        // Process the audio
        timer.pause()
        setIsRecording(false)
        setIsPaused(false)
        setTranscriptionStatus('uploading')

        try {
          const fileName = `recording-${Date.now()}.webm`
          const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' })

          const result = await transcriptionService.processAudio(audioFile, {
            onUploadComplete: () => setTranscriptionStatus('uploading'),
            onTranscriptionStarted: () => setTranscriptionStatus('processing'),
            onProgress: (status) => {
              if (status.status === 'processing') setTranscriptionStatus('processing')
            }
          })

          setTranscription(result.transcriptionId, result.transcript || '')
        } catch (err) {
          setError(err instanceof Error ? err.message : t('doc_gen_wizard.audio.process_error', 'Failed to process audio.'))
          setTranscriptionStatus('error')
        } finally {
          timer.reset()
          mediaRecorderRef.current = null
          audioChunksRef.current = []
          resolve()
        }
      }

      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop()
      } else {
        resolve()
      }
    })
  }

  const resetRecordingState = () => {
    setIsRecording(false)
    setIsPaused(false)
    setTranscriptionStatus('idle')
    timer.reset()
    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }

  const isProcessing = ['uploading', 'processing'].includes(transcriptionStatus)
  const isCompleted = transcriptionStatus === 'completed'

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      {!isProcessing && !isCompleted && (
        <div className="flex flex-col items-center gap-5 p-8 bg-gray-50 rounded-xl border border-gray-200">
          {/* Timer */}
          <div className="text-4xl font-mono font-bold text-gray-900">
            {timer.formatTime(timer.time)}
          </div>

          {/* Minimum duration hint */}
          {isRecording && timer.time < 60 && (
            <p className="text-xs text-amber-600">
              {t('doc_gen_wizard.audio.min_duration', 'Minimum 1 minute recording required')}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button
                variant="primary"
                onClick={startRecording}
                className="flex items-center gap-2 px-6"
              >
                <Mic className="w-5 h-5" />
                {t('doc_gen_wizard.audio.start_recording', 'Start Recording')}
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button variant="outline" onClick={resumeRecording} className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {t('doc_gen_wizard.audio.resume', 'Resume')}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={pauseRecording} className="flex items-center gap-2">
                    <Pause className="w-4 h-4" />
                    {t('doc_gen_wizard.audio.pause', 'Pause')}
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={stopRecording}
                  disabled={timer.time < 60}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  {t('doc_gen_wizard.audio.stop', 'Stop & Transcribe')}
                </Button>
              </>
            )}
          </div>

          {/* Recording indicator */}
          {isRecording && !isPaused && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-600 font-medium">
                {t('doc_gen_wizard.audio.recording', 'Recording...')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transcription Progress */}
      {(isProcessing || transcriptionStatus === 'error') && (
        <WizardTranscriptionProgress status={transcriptionStatus} error={error} />
      )}

      {/* Error display */}
      {error && !isProcessing && transcriptionStatus !== 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
    </div>
  )
}
