import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  Mic,
  Play,
  Pause,
  Square,
  User,
  Save,
  AlertCircle,
  Upload,
  Plus,
  Bot,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  FileText
} from 'lucide-react'

// LocalStorage key for draft persistence
const DRAFT_STORAGE_KEY = 'tq-new-session-draft'

// Draft state interface
interface DraftState {
  transcription: string
  createdTranscriptionId: string | null
  patientMode: 'search' | 'create'
  patientName: string
  searchQuery: string
  selectedPatient: Patient | null
  createdPatient: Patient | null
  savedAt: number
}
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  Select,
  Alert,
  AlertTitle,
  AlertDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  LinkToast,
  Modal
} from '@client/common/ui'
import { useAuthStore } from '../../shared/store'
import { sessionsService, Session } from '../../services/sessions'
import { patientsService, Patient } from '../../services/patients'
import { quotesService, CreateQuoteRequest } from '../../services/quotes'
import { clinicalNotesService } from '../../services/clinicalNotes'
import { aiAgentService } from '../../services/aiAgentService'
import { publishFeedback } from '@client/common/feedback'
import { parsePatientName } from '../../lib/parsePatientName'
import { plainTextToHtml } from '../../lib/textToHtml'
import { AudioUploadModal } from '../../components/new-session/AudioUploadModal'
import { TemplateQuoteModal } from '../../components/new-session/TemplateQuoteModal'
import { AIAgentModal } from '../../components/ai-agent/AIAgentModal'
import { useTranscription } from '../../hooks/useTranscription'
import { transcriptionService, QuotaResponse } from '../../services/transcriptionService'

// Hook para debounce
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para timer
function useTimer(initialTime: number = 0) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setTime(time => time + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback(() => {
    setTime(0)
    setIsRunning(false)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return { time, isRunning, start, pause, reset, formatTime }
}

export const NewSession: React.FC = () => {
  const { t } = useTranslation('tq')
  const { user } = useAuthStore()
  const { state: transcriptionState, transcriptionId, actions: transcriptionActions } = useTranscription()

  // Session State Management - single session per patient + transcription context
  const [session, setSession] = useState<Session | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  // Session context - tracks current patient and transcription for session reuse
  const [sessionContext, setSessionContext] = useState<{
    patientId: string | null
    transcriptionId: string | null
  }>({
    patientId: null,
    transcriptionId: null
  })

  // Transcription ID created (before session)
  const [createdTranscriptionId, setCreatedTranscriptionId] = useState<string | null>(null)

  const [isLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Transcription text state - independent from transcription hook
  const [transcription, setTranscription] = useState<string>('')
  // Patient-related state removed - using simplified UI now

  // Mock audio devices (static for now)
  const [audioDevices] = useState<MediaDeviceInfo[]>([
    {
      deviceId: 'default',
      kind: 'audioinput',
      label: 'Default Microphone',
      groupId: 'default'
    } as MediaDeviceInfo,
    {
      deviceId: 'mic-1',
      kind: 'audioinput',
      label: 'Built-in Microphone',
      groupId: 'builtin'
    } as MediaDeviceInfo
  ])

  const [selectedDevice, setSelectedDevice] = useState<string>('default')
  const [vuLevel, setVuLevel] = useState(0)

  // Timer hook
  const timer = useTimer()

  // Estado do recording
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Processing state for upload/transcription feedback
  const [isProcessingAudio, setIsProcessingAudio] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [processingError, setProcessingError] = useState(false) // Track if processing resulted in error

  // MediaRecorder refs for actual audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Audio upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)

  // AI Agent modal state
  const [showAIAgentModal, setShowAIAgentModal] = useState(false)

  // Template Quote modal state
  const [showTemplateQuoteModal, setShowTemplateQuoteModal] = useState(false)

  // Link toast state
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{itemId: string, itemNumber: string, type: 'session' | 'quote' | 'clinical-report' | 'clinical-note' | 'prevention'} | null>(null)

  // UI state for dropdown and patient flow
  const [transcribeMode, setTranscribeMode] = useState<'start' | 'upload'>('start')
  const [patientMode, setPatientMode] = useState<'search' | 'create'>('search')
  const [patientName, setPatientName] = useState('')
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null)

  // Patient search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Quota state
  const [quota, setQuota] = useState<QuotaResponse | null>(null)
  const [isLoadingQuota, setIsLoadingQuota] = useState(true)

  // Workflow help modal state
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Draft restoration flag - prevents saving during initial load
  const [isDraftRestored, setIsDraftRestored] = useState(false)

  // Dropdown is now handled by the DropdownMenu component

  // Check if there are unsaved changes (for beforeunload warning)
  const hasUnsavedChanges = useMemo(() => {
    const hasTranscription = transcription.trim().length > 0
    const hasPatient = selectedPatient !== null || createdPatient !== null
    const noSessionYet = !session
    return hasTranscription && hasPatient && noSessionYet
  }, [transcription, selectedPatient, createdPatient, session])

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (savedDraft) {
        const draft: DraftState = JSON.parse(savedDraft)

        // Check if draft is not too old (24 hours max)
        const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours
        if (Date.now() - draft.savedAt < MAX_AGE) {
          // Restore state
          if (draft.transcription) setTranscription(draft.transcription)
          if (draft.createdTranscriptionId) setCreatedTranscriptionId(draft.createdTranscriptionId)
          if (draft.patientMode) setPatientMode(draft.patientMode)
          if (draft.patientName) setPatientName(draft.patientName)
          if (draft.searchQuery) setSearchQuery(draft.searchQuery)
          if (draft.selectedPatient) setSelectedPatient(draft.selectedPatient)
          if (draft.createdPatient) setCreatedPatient(draft.createdPatient)
        } else {
          // Draft too old, clear it
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        }
      }
    } catch {
      // Silent fail - localStorage might not be available
    }
    setIsDraftRestored(true)
  }, [])

  // Save draft to localStorage when state changes (debounced)
  useEffect(() => {
    // Don't save during initial load
    if (!isDraftRestored) return

    // Don't save if session already created (draft is complete)
    if (session) return

    const timeoutId = setTimeout(() => {
      try {
        const draft: DraftState = {
          transcription,
          createdTranscriptionId,
          patientMode,
          patientName,
          searchQuery,
          selectedPatient,
          createdPatient,
          savedAt: Date.now()
        }

        // Only save if there's meaningful data
        const hasData = transcription.trim() || selectedPatient || createdPatient || patientName.trim()
        if (hasData) {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        }
      } catch {
        // Silent fail
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [
    isDraftRestored,
    session,
    transcription,
    createdTranscriptionId,
    patientMode,
    patientName,
    searchQuery,
    selectedPatient,
    createdPatient
  ])

  // Clear draft from localStorage and reset all form state
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      // Reset all form state
      setTranscription('')
      setCreatedTranscriptionId(null)
      setPatientMode('search')
      setPatientName('')
      setSearchQuery('')
      setSelectedPatient(null)
      setCreatedPatient(null)
      setSession(null)
      setSessionContext({ patientId: null, transcriptionId: null })
      timer.reset()
    } catch {
      // Silent fail
    }
  }, [timer])

  // beforeunload warning when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Simulate autosave without API calls (for now)
  const debouncedTranscription = useDebouncedValue(transcription, 2000)

  // Debounced search query
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Load quota on mount
  useEffect(() => {
    const loadQuota = async () => {
      try {
        setIsLoadingQuota(true)
        const quotaData = await transcriptionService.getQuota()
        setQuota(quotaData)
      } catch (error) {
        // Don't show error feedback - just fail silently and don't block UI
      } finally {
        setIsLoadingQuota(false)
      }
    }

    loadQuota()
  }, [])

  // Handle transcription completion from hook
  useEffect(() => {
    if (transcriptionState.status === 'completed' && transcriptionState.transcript) {
      publishFeedback({
        kind: 'success',
        code: 'TRANSCRIPTION_COMPLETED',
        message: `Transcription completed with ${Math.round((transcriptionState.confidenceScore || 0) * 100)}% confidence`
      })
    } else if (transcriptionState.status === 'failed_empty_transcript') {
      publishFeedback({
        kind: 'info',
        title: t('sessions.transcription_warnings.empty_warning_title'),
        message: t('sessions.transcription_warnings.empty_warning_message')
      })
    } else if (transcriptionState.status === 'failed' && transcriptionState.error) {
      publishFeedback({
        kind: 'error',
        code: 'TRANSCRIPTION_FAILED',
        message: transcriptionState.error
      })
    }
  }, [transcriptionState.status, transcriptionState.transcript, transcriptionState.error, transcriptionState.confidenceScore, t])

  // Simulate autosave feedback (for now)
  useEffect(() => {
    if (!debouncedTranscription || debouncedTranscription === session?.transcription) return

    // Simulate saving
    setIsSaving(true)
    const timeout = setTimeout(() => {
      setIsSaving(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [debouncedTranscription, session?.transcription])

  // Patient search effect
  useEffect(() => {
    const searchPatients = async () => {
      if (patientMode !== 'search' || !debouncedSearchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await patientsService.searchPatients({
          search: debouncedSearchQuery,
          limit: 10 // Buscar mais resultados para poder fazer a ordenação
        })

        // Ordenar resultados: STARTS WITH primeiro, depois CONTAINS
        const sortedResults = results
          .map(patient => {
            const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim().toLowerCase()
            const searchLower = debouncedSearchQuery.toLowerCase()

            // Verificar se o nome completo ou primeiro nome ou último nome começam com a busca
            const startsWithFull = fullName.startsWith(searchLower)
            const startsWithFirst = (patient.firstName || '').toLowerCase().startsWith(searchLower)
            const startsWithLast = (patient.lastName || '').toLowerCase().startsWith(searchLower)
            const startsWith = startsWithFull || startsWithFirst || startsWithLast

            return {
              ...patient,
              _searchScore: startsWith ? 1 : 0 // 1 para STARTS WITH, 0 para CONTAINS
            }
          })
          .sort((a, b) => b._searchScore - a._searchScore) // Ordenar por score (STARTS WITH primeiro)
          .slice(0, 5) // Limitar a 5 resultados finais
          .map(({ _searchScore, ...patient }) => patient) // Remover o campo auxiliar

        setSearchResults(sortedResults)
        setShowSearchResults(sortedResults.length > 0)
      } catch (error) {
        setSearchResults([])
        setShowSearchResults(false)
      } finally {
        setIsSearching(false)
      }
    }

    searchPatients()
  }, [debouncedSearchQuery, patientMode])

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Context change detection - reset session when patient or transcription changes
  useEffect(() => {
    if (!session) return // No session to reset

    const patient = selectedPatient || createdPatient
    const currentPatientId = patient?.id || null
    const currentTranscriptionId = createdTranscriptionId

    // Check if patient changed
    if (sessionContext.patientId !== currentPatientId && currentPatientId !== null) {
      setSession(null)
      setSessionContext({ patientId: null, transcriptionId: null })
      setCreatedTranscriptionId(null)
      return
    }

    // Check if transcription changed significantly (only if we have a transcription ID)
    if (currentTranscriptionId && sessionContext.transcriptionId !== currentTranscriptionId) {
      setSession(null)
      setSessionContext({ patientId: null, transcriptionId: null })
    }
  }, [selectedPatient, createdPatient, createdTranscriptionId, session, sessionContext])

  // Audio devices are now mocked above - no API calls needed

  // Mock VU meter
  useEffect(() => {
    if (!isTranscribing || isPaused) {
      setVuLevel(0)
      return
    }

    const interval = setInterval(() => {
      // Simular VU meter com valores aleatórios
      setVuLevel(Math.random() * 100)
    }, 100)

    return () => clearInterval(interval)
  }, [isTranscribing, isPaused])

  // Cleanup on component unmount - stop recording and release microphone
  useEffect(() => {
    return () => {
      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      // Stop all audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Auto-create session when patient is already selected and transcription completes
  useEffect(() => {
    const patient = selectedPatient || createdPatient
    const hasTranscription = createdTranscriptionId && transcription.trim().length > 0
    const canAutoCreate = patient && hasTranscription && !session && !isCreatingSession

    if (!canAutoCreate) return

    const autoCreateSession = async () => {
      setIsCreatingSession(true)
      try {
        const newSession = await createSessionWithTranscription(patient.id, createdTranscriptionId!)

        setSessionContext({
          patientId: patient.id,
          transcriptionId: createdTranscriptionId
        })

        // Clear draft from localStorage
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        } catch {
          // Silent fail
        }

        // Show session link toast
        setToastData({
          itemId: newSession.id,
          itemNumber: newSession.number,
          type: 'session'
        })
        setShowLinkToast(true)
      } catch (error) {
        // Error feedback is handled automatically by HTTP interceptor
      } finally {
        setIsCreatingSession(false)
      }
    }

    autoCreateSession()
  }, [createdTranscriptionId, selectedPatient, createdPatient, session, isCreatingSession])

  // Derived quota state
  const isQuotaExceeded = quota !== null && quota.remaining <= 0 && !quota.overageAllowed
  const isQuotaWarning = quota !== null && quota.percentUsed >= 80 && quota.percentUsed < 100
  const shouldDisableTranscription = isQuotaExceeded

  // Handlers (mocked for now)
  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'completed') => {
    // Mock status change - in real implementation, this would call API
  }

  // Create session for patient
  const createSession = async (patientId: string) => {
    try {
      setIsCreatingSession(true)
      const newSession = await sessionsService.createSession({
        patient_id: patientId,
        status: 'draft'
      })
      setSession(newSession)
      return newSession
    } catch (error) {
      // Error feedback is handled automatically by HTTP interceptor
      throw error
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Create session with transcription ID
  const createSessionWithTranscription = async (patientId: string, transcriptionId: string) => {
    try {
      setIsCreatingSession(true)
      const newSession = await sessionsService.createSession({
        patient_id: patientId,
        transcription_id: transcriptionId,
        status: 'draft'
      })
      setSession(newSession)
      return newSession
    } catch (error) {
      // Error feedback is handled automatically by HTTP interceptor
      throw error
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Ensure Session - Central function to reuse or create session
  const ensureSession = async (): Promise<Session> => {
    const patient = selectedPatient || createdPatient
    if (!patient) {
      throw new Error('Patient required')
    }

    // Get or create transcription ID
    let currentTranscriptionId = createdTranscriptionId

    if (!currentTranscriptionId && transcription.trim()) {
      const newTranscription = await transcriptionService.createTextTranscription(transcription)
      currentTranscriptionId = newTranscription.transcriptionId
      setCreatedTranscriptionId(currentTranscriptionId)
    }

    if (!currentTranscriptionId) {
      throw new Error('Transcription required')
    }

    // Check if context changed (patient or transcription different)
    const contextChanged =
      !session ||
      sessionContext.patientId !== patient.id ||
      sessionContext.transcriptionId !== currentTranscriptionId

    if (contextChanged) {
      // Create new session
      const newSession = await createSessionWithTranscription(patient.id, currentTranscriptionId)

      // Update context
      setSessionContext({
        patientId: patient.id,
        transcriptionId: currentTranscriptionId
      })

      return newSession
    }

    // Reuse existing session
    return session
  }


  // Handle New Session button click
  const handleNewSession = async () => {
    if (!transcription.trim()) {
      return
    }

    const patient = selectedPatient || createdPatient
    if (!patient) {
      publishFeedback({
        kind: 'error',
        code: 'PATIENT_REQUIRED',
        message: 'Please select or create a patient before saving the session'
      })
      return
    }

    setIsCreatingSession(true)
    try {
      const newSession = await ensureSession()
      // Success feedback is handled automatically by HTTP interceptor

      // Clear draft from localStorage after successful creation (but keep form state)
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // Silent fail
      }

      // Show session link toast
      setToastData({
        itemId: newSession.id,
        itemNumber: newSession.number,
        type: 'session'
      })
      setShowLinkToast(true)

    } catch (error) {
      // Error feedback is handled automatically by HTTP interceptor
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Handle New Session & Quote button click
  const handleNewSessionAndQuote = async (aiSummary?: string) => {
    // If called from AI Agent, aiSummary will be provided and we should use it
    // If called from button, transcription should exist
    if (!transcription.trim() && !aiSummary) {
      return
    }

    const patient = selectedPatient || createdPatient
    if (!patient) {
      publishFeedback({
        kind: 'error',
        code: 'PATIENT_REQUIRED',
        message: 'Please select or create a patient before saving the session'
      })
      return
    }

    try {
      // Ensure session exists (reuse or create)
      const currentSession = await ensureSession()

      // Create the quote using the session ID
      const rawContent = aiSummary || transcription // Use AI summary if provided, otherwise fallback to transcription

      // Convert plain text to HTML for TipTap editor (preserves line breaks and paragraphs)
      const htmlContent = plainTextToHtml(rawContent)

      const quoteData: CreateQuoteRequest = {
        sessionId: currentSession.id,
        content: htmlContent,
        status: 'draft'
      }
      const newQuote = await quotesService.createQuote(quoteData)

      // Clear draft from localStorage after successful creation (but keep form state)
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // Silent fail
      }

      // Show quote link toast (redirects to /quotes)
      setToastData({
        itemId: newQuote.id,
        itemNumber: newQuote.number,
        type: 'quote'
      })
      setShowLinkToast(true)

    } catch (error) {
      // Error feedback is handled automatically by HTTP interceptor
    }
  }

  // Handle Clinical Report creation from AI Agent
  const handleNewClinicalReport = async (aiSummary: string) => {
    // If called from AI Agent, aiSummary will be provided and we should use it
    // If called from button, transcription should exist
    if (!transcription.trim() && !aiSummary) {
      return
    }

    const patient = selectedPatient || createdPatient
    if (!patient) {
      publishFeedback({
        kind: 'error',
        code: 'PATIENT_REQUIRED',
        message: 'Please select or create a patient before creating clinical report'
      })
      return
    }

    try {
      // Ensure session exists (reuse or create)
      const currentSession = await ensureSession()

      // Create the clinical report using the session ID
      const rawContent = aiSummary || transcription

      // Convert plain text to HTML for TipTap editor (preserves line breaks and paragraphs)
      const htmlContent = plainTextToHtml(rawContent)

      const reportData = {
        sessionId: currentSession.id,
        content: htmlContent
      }
      const newReport = await clinicalNotesService.create(reportData)

      // Defensive: check if report has required fields
      if (!newReport || !newReport.id || !newReport.number) {
        throw new Error('Invalid clinical report response from API')
      }

      // Clear draft from localStorage after successful creation (but keep form state)
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // Silent fail
      }

      // Show LinkToast for navigation (not publishFeedback - feedback is automatic)
      setToastData({
        itemId: newReport.id,
        itemNumber: newReport.number,
        type: 'clinical-report'
      })
      setShowLinkToast(true)

    } catch (error) {
      // Error feedback is handled automatically by HTTP interceptor
    }
  }

  // Check if New Session button should be enabled (requires patient + transcription, no session yet)
  const isNewSessionEnabled = () => {
    const hasTranscription = transcription.trim().length > 0
    const hasPatient = selectedPatient !== null || createdPatient !== null
    const noSessionYet = !session
    return hasTranscription && hasPatient && noSessionYet && !isCreatingSession
  }

  // Check if Quote/Clinical Report buttons should be enabled (requires existing session)
  const isQuoteOrReportEnabled = () => {
    return session !== null
  }

  // Handle Template Quote Modal actions
  const handleTemplateCreateQuote = async (templateId: string) => {
    // TODO: Implement template-based quote creation
    // This will use the AI Template Filler endpoint to fill the template
    // and then create a quote with the filled content
  }

  // Handle Template Quote creation callback
  const handleTemplateQuoteCreated = (quoteId: string, quoteNumber: string) => {
    // Clear draft from localStorage after successful creation (but keep form state)
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Silent fail
    }

    // Show quote link toast (redirects to /documents/quote)
    setToastData({
      itemId: quoteId,
      itemNumber: quoteNumber,
      type: 'quote'
    })
    setShowLinkToast(true)
  }

  // Handle Clinical Note creation callback
  const handleTemplateClinicalNoteCreated = (noteId: string, noteNumber: string) => {
    // Clear draft from localStorage after successful creation (but keep form state)
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Silent fail
    }

    // Show clinical note link toast (redirects to /documents/clinical-note)
    setToastData({
      itemId: noteId,
      itemNumber: noteNumber,
      type: 'clinical-note'
    })
    setShowLinkToast(true)
  }

  // Handle Prevention creation callback
  const handleTemplatePreventionCreated = (preventionId: string, preventionNumber: string) => {
    // Clear draft from localStorage after successful creation (but keep form state)
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Silent fail
    }

    // Show prevention link toast (redirects to /documents/prevention)
    setToastData({
      itemId: preventionId,
      itemNumber: preventionNumber,
      type: 'prevention'
    })
    setShowLinkToast(true)
  }

  const handleTemplateCreateClinicalReport = async (templateId: string) => {
    const patient = selectedPatient || createdPatient
    if (!patient) {
      publishFeedback({
        kind: 'error',
        code: 'PATIENT_REQUIRED',
        message: 'Please select or create a patient before creating clinical report'
      })
      return
    }

    if (!session) {
      publishFeedback({
        kind: 'error',
        code: 'SESSION_REQUIRED',
        message: 'Please create a session first'
      })
      return
    }

    try {
      // Fill template with AI using session transcription
      const fillTemplateRequest = {
        templateId,
        sessionId: session.id,
        patientId: patient.id
      }

      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)

      // Create clinical report with filled template content
      const reportData = {
        sessionId: session.id,
        content: filledTemplateResponse.filledTemplate
      }

      const newReport = await clinicalNotesService.create(reportData)

      // Defensive: check if report has required fields
      if (!newReport || !newReport.id || !newReport.number) {
        throw new Error('Invalid clinical report response from API')
      }

      // Clear draft from localStorage after successful creation (but keep form state)
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // Silent fail
      }

      // Show LinkToast for navigation
      setToastData({
        itemId: newReport.id,
        itemNumber: newReport.number,
        type: 'clinical-report'
      })
      setShowLinkToast(true)

    } catch (error) {
      // Error feedback is handled automatically by HTTP interceptor
    }
  }

  // Handle transcription completion callback from the modal
  const handleTranscriptionComplete = useCallback((transcript: string, transcriptionId: string) => {
    // Update the transcription field with the result
    setTranscription(transcript)

    // Store transcription ID for session creation
    setCreatedTranscriptionId(transcriptionId)

    // Success feedback is handled automatically by HTTP interceptor via TRANSCRIPTION_COMPLETED meta.code
  }, [])

  // New handlers for simplified UI
  const handleTranscribeModeSelect = (mode: 'start' | 'upload') => {
    setTranscribeMode(mode)
  }

  const handlePatientModeToggle = async () => {
    if (patientMode === 'search') {
      setPatientMode('create')
      setPatientName('')
      setCreatedPatient(null)
      // Clear search state
      setSearchQuery('')
      setSearchResults([])
      setSelectedPatient(null)
    } else {
      // Create patient

      if (!patientName.trim()) {
        publishFeedback({
          kind: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Patient name is required'
        })
        return
      }

      setIsCreatingPatient(true)

      try {
        const { firstName, lastName } = parsePatientName(patientName)

        const newPatient = await patientsService.createPatient({
          first_name: firstName,
          last_name: lastName
        })

        publishFeedback({
          kind: 'success',
          code: 'PATIENT_CREATED'
        })

        // Keep the patient selected in the input with green border
        setCreatedPatient(newPatient)
        // Don't reset patientName - keep it showing the created patient
        // Don't change back to search mode - stay in create mode but disabled

      } catch (error) {
        publishFeedback({
          kind: 'error',
          code: 'PATIENT_CREATION_FAILED',
          message: 'Failed to create patient. Please try again.'
        })
      } finally {
        setIsCreatingPatient(false)
      }
    }
  }


  const toggleTranscribing = async () => {
    if (!isTranscribing) {
      // Start recording - clear any previous error state
      setProcessingError(false)
      setIsProcessingAudio(false)
      setProcessingMessage('')

      try {
        // Get user media (microphone access)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: selectedDevice !== 'default' ? { exact: selectedDevice } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })

        audioStreamRef.current = stream
        audioChunksRef.current = []

        // Create MediaRecorder with WEBM format (works with Deepgram)
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        })

        mediaRecorderRef.current = mediaRecorder

        // Collect audio data chunks
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        // Start recording
        mediaRecorder.start(1000) // Collect chunks every 1 second

        setIsTranscribing(true)
        setIsPaused(false)
        timer.start()

        if (session?.status === 'draft') {
          handleStatusChange('active')
        }

      } catch (error) {
        publishFeedback({
          kind: 'error',
          code: 'RECORDING_FAILED',
          message: 'Failed to access microphone. Please check permissions.',
          path: '/tq/new-session'
        })
      }
    } else if (!isPaused) {
      // Pause recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        timer.pause()
      }
    } else {
      // Resume recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        timer.start()
      }
    }
  }

  const stopTranscribing = async () => {
    if (!mediaRecorderRef.current) {
      setIsTranscribing(false)
      setIsPaused(false)
      timer.pause()
      return
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!

      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop())
          audioStreamRef.current = null
        }

        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const durationSeconds = timer.time
        const durationMin = Math.floor(durationSeconds / 60)
        const durationSec = durationSeconds % 60

        // Validate audio has content
        if (audioBlob.size === 0) {
          publishFeedback({
            kind: 'error',
            code: 'RECORDING_EMPTY',
            message: 'Recording failed - no audio data captured. Please try again.',
            path: '/tq/new-session'
          })

          // Reset UI state
          setIsTranscribing(false)
          setIsPaused(false)
          timer.reset()

          // Clear refs
          mediaRecorderRef.current = null
          audioChunksRef.current = []

          resolve()
          return
        }

        // Validate minimum duration (1 minute = 60 seconds)
        if (durationSeconds < 60) {
          const recordingDuration = `${durationMin}:${durationSec.toString().padStart(2, '0')}`
          publishFeedback({
            kind: 'error',
            code: 'RECORDING_TOO_SHORT',
            message: t('sessions.recording.too_short', { duration: recordingDuration }),
            path: '/tq/new-session'
          })

          // Reset UI state
          setIsTranscribing(false)
          setIsPaused(false)
          timer.reset()

          // Clear refs
          mediaRecorderRef.current = null
          audioChunksRef.current = []

          resolve()
          return
        }

        // Stop timer immediately before processing
        timer.pause()

        // Upload audio file and create transcription
        let shouldKeepAlertVisible = false // Local variable to avoid React state timing issues

        try {
          setIsProcessingAudio(true)
          setProcessingMessage(t('sessions.recording.preparing'))

          const fileName = `recording-${Date.now()}.webm`
          const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' })

          // Use processAudio method which handles: upload → transcribe → poll for completion
          const result = await transcriptionService.processAudio(audioFile, {
            onUploadComplete: (transcriptionId) => {
              setProcessingMessage(t('sessions.recording.uploaded'))
            },
            onTranscriptionStarted: (transcriptionId) => {
              setProcessingMessage(t('sessions.recording.transcribing'))
            },
            onProgress: (status) => {
              const statusMessages: Record<string, string> = {
                'uploading': t('sessions.recording.uploading'),
                'uploaded': t('sessions.recording.uploaded'),
                'processing': t('sessions.recording.processing'),
                'completed': t('sessions.recording.completed')
              }
              setProcessingMessage(statusMessages[status.status] || t('sessions.recording.processing'))
            }
          })

          // Check for empty transcript (language mismatch) and show inline error
          if (result.status === 'failed_empty_transcript') {
            shouldKeepAlertVisible = true // Use local variable - React state won't update in time for finally block
            setProcessingError(true)
            setProcessingMessage(t('sessions.transcription_warnings.empty_warning_title'))
            setIsProcessingAudio(true) // Keep alert visible
          } else {
            setProcessingMessage(t('sessions.recording.completed'))
          }

          // Update UI with transcription result
          setTranscription(result.transcript || '')
          setCreatedTranscriptionId(result.transcriptionId)

          // Success feedback is automatic via HTTP interceptor (TRANSCRIPTION_COMPLETED)

        } catch (error) {
          publishFeedback({
            kind: 'error',
            code: 'TRANSCRIPTION_UPLOAD_FAILED',
            message: error instanceof Error ? error.message : 'Failed to process audio file. Please try again.',
            path: '/tq/new-session'
          })
        } finally {
          // Reset UI state (but keep error feedback visible if shouldKeepAlertVisible is true)
          setIsTranscribing(false)
          setIsPaused(false)

          // Only clear processing feedback if there was no error
          // Use local variable instead of state to avoid timing issues
          if (!shouldKeepAlertVisible) {
            setIsProcessingAudio(false)
            setProcessingMessage('')
          }

          timer.reset()  // Reset timer instead of just pausing

          // Clear refs
          mediaRecorderRef.current = null
          audioChunksRef.current = []

          resolve()
        }
      }

      // Stop the recorder
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop()
      } else {
        resolve()
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Session is now mocked, so no need for null check

  return (
    <div className="space-y-8"> {/* Increased main vertical spacing */}
      {/* Header with Title and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{t('sessions.create')}</h1>
            {/* Session badge - shows after session is created */}
            {session && (
              <Link
                to={`/sessions/${session.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-white bg-[#B725B7] hover:bg-[#9a1f9a] rounded-full transition-colors"
              >
                {session.number}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            {/* Help button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#B725B7] bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              {t('sessions.workflow_guide.title')}
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {t('sessions.pages.new_session_subtitle')}
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center space-x-4">
          {/* Timer */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Time:</span>
            <span className="font-mono text-lg font-semibold">
              {timer.formatTime(timer.time)}
            </span>
          </div>

          {/* VU Meter */}
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-gray-600" />
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${vuLevel}%` }}
              />
            </div>
          </div>

          {/* Audio Device Selector */}
          <Select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            options={audioDevices.map(device => ({
              value: device.deviceId,
              label: device.label || `Microphone ${device.deviceId.slice(0, 8)}...`
            }))}
            placeholder={t('sessions.select_microphone')}
            className="w-40"
          />

          {/* Transcribing Button Group - When NOT recording */}
          {!isTranscribing && (
            <div className="flex items-center bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm transition-colors">
              {/* Main Action Button */}
              <Button
                onClick={transcribeMode === 'start' ? toggleTranscribing : () => setShowUploadModal(true)}
                variant="primary"
                size="lg"
                disabled={shouldDisableTranscription}
                className="font-semibold rounded-r-none border-r-0 bg-transparent hover:bg-transparent shadow-none border-0 text-white"
              >
                {transcribeMode === 'start' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('sessions.start_transcribing')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('sessions.upload_audio')}
                  </>
                )}
              </Button>

              {/* Separator line */}
              <div className="w-px h-6 bg-white/20"></div>

              {/* Dropdown Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-3 rounded-l-none bg-transparent hover:bg-white/10 shadow-none border-0 text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {transcribeMode === 'start' ? (
                    <DropdownMenuItem onClick={() => handleTranscribeModeSelect('upload')}>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('sessions.upload_audio')}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleTranscribeModeSelect('start')}>
                      <Play className="w-4 h-4 mr-2" />
                      {t('sessions.start_transcribing')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Recording Controls - When recording */}
          {isTranscribing && (
            <div className="flex items-center gap-2">
              {/* Pause/Resume Button */}
              <Button
                onClick={toggleTranscribing}
                variant="secondary"
                size="lg"
                className="font-semibold"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('sessions.resume')}
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    {t('sessions.pause')}
                  </>
                )}
              </Button>

              {/* Stop Button */}
              <Button
                onClick={stopTranscribing}
                variant="destructive"
                size="lg"
                className="font-semibold"
              >
                <Square className="w-4 h-4 mr-2" />
                {t('sessions.stop')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quota Alerts */}
      {!isLoadingQuota && isQuotaExceeded && (
        <Alert variant="gradient">
          <AlertCircle className="h-5 w-5 text-[#E91E63] mt-0.5" />
          <div>
            <AlertTitle>{t('transcription.quota_exceeded_title')}</AlertTitle>
            <AlertDescription>
              {t('transcription.quota_exceeded_message', { limit: quota?.limit })}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {!isLoadingQuota && isQuotaWarning && !isQuotaExceeded && (
        <Alert variant="warning">
          <AlertCircle className="h-5 w-5 text-[#EAB308] mt-0.5" />
          <div>
            <AlertTitle>{t('transcription.quota_warning_title')}</AlertTitle>
            <AlertDescription>
              {t('transcription.quota_warning_message', {
                used: quota?.minutesUsed,
                limit: quota?.limit,
                percent: quota?.percentUsed
              })}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="border-t border-gray-200" />

      {/* Patient Details Section - Simplified (no Card wrapper) */}
      <div className="space-y-4"> {/* Adjusted internal spacing */}
        {/* Title with icon */}
        <h2 className="flex items-center text-lg font-semibold text-gray-900">
          <User className="w-5 h-5 mr-2" />
          {t('sessions.add_patient_details')}
        </h2>

        {/* Input and buttons in same line - left side: patient input, right side: action buttons */}
        <div className="flex items-center justify-between w-full">
          {/* Left side: Patient input and create button */}
          <div className="flex items-center gap-3">
            <div ref={searchContainerRef} className="relative w-80">
              <Input
                placeholder={
                  patientMode === 'search'
                    ? t('sessions.placeholders.search_patient')
                    : t('sessions.placeholders.enter_patient_name')
                }
                value={patientMode === 'search' ? searchQuery : patientName}
                onChange={(e) => {
                  if (patientMode === 'search') {
                    setSearchQuery(e.target.value)
                    setSelectedPatient(null)
                    setShowSearchResults(true)
                  } else if (patientMode === 'create' && !createdPatient) {
                    setPatientName(e.target.value)
                  }
                }}
                onFocus={() => {
                  if (patientMode === 'search' && searchResults.length > 0) {
                    setShowSearchResults(true)
                  }
                }}
                disabled={isCreatingPatient || !!createdPatient || (patientMode === 'search' && selectedPatient)}
                className={`bg-white flex-shrink-0 ${
                  createdPatient ? 'border-2 border-[var(--brand-tertiary)] focus:border-[var(--brand-tertiary)]' :
                  selectedPatient ? 'border-2 border-[var(--brand-tertiary)] focus:border-[var(--brand-tertiary)]' : ''
                }`}
              />

              {/* Search results dropdown */}
              {patientMode === 'search' && searchQuery.trim() && showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-md last:rounded-b-md border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setSelectedPatient(patient)
                        setSearchQuery(`${patient.firstName || ''} ${patient.lastName || ''}`.trim())
                        setShowSearchResults(false)
                      }}
                    >
                      <div className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </div>
                      {patient.email && (
                        <div className="text-sm text-gray-500">{patient.email}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {patientMode === 'search' && isSearching && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                </div>
              )}
            </div>

{createdPatient ? (
              <div className="flex items-center gap-1 text-[var(--brand-tertiary)] font-medium flex-shrink-0 whitespace-nowrap">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('sessions.patient_created_successfully')}
              </div>
            ) : selectedPatient ? (
              <div className="flex items-center gap-1 text-[var(--brand-tertiary)] font-medium flex-shrink-0 whitespace-nowrap">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('sessions.patient_selected')}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePatientModeToggle}
                disabled={isCreatingPatient || (patientMode === 'create' && !patientName.trim())}
                style={{ color: '#B725B7' }}
                className="flex items-center gap-1 hover:bg-purple-50 flex-shrink-0 whitespace-nowrap"
              >
                {patientMode === 'search' ? (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('sessions.create_new_patient')}
                  </>
                ) : (
                  <>
                    {isCreatingPatient ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-1" />
                        {t('common.saving')}
                      </>
                    ) : (
                      <>
                        {t('common.save')}
                      </>
                    )}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Clear draft button - always visible */}
            <button
              onClick={clearDraft}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title={t('sessions.clear_draft')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* New Session - Primary action with animated gradient border when enabled */}
            <div className="relative inline-block">
              {isNewSessionEnabled() && (
                <div
                  className="absolute -inset-[3px] rounded-md animate-pulse"
                  style={{
                    background: 'linear-gradient(90deg, #B725B7, #E91E63, #B725B7)',
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 3s ease infinite, pulse 2s ease-in-out infinite',
                    zIndex: 0
                  }}
                />
              )}
              <Button
                variant="primary"
                disabled={!isNewSessionEnabled()}
                onClick={handleNewSession}
                className="flex items-center gap-2 relative z-10"
              >
                {isCreatingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('sessions.create')}
                  </>
                )}
              </Button>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes gradient-shift {
                  0% {
                    background-position: 0% 50%;
                  }
                  50% {
                    background-position: 100% 50%;
                  }
                  100% {
                    background-position: 0% 50%;
                  }
                }
              `
            }} />

            {/* New Quote or Clinical Report - Only enabled after session created */}
            <Button
              variant="primary"
              disabled={!isQuoteOrReportEnabled()}
              onClick={() => setShowTemplateQuoteModal(true)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {t('sessions.create_documents')}
            </Button>

            {/* Call AI Agent - Only enabled after session created */}
            <Button
              variant="primary"
              disabled={!isQuoteOrReportEnabled()}
              onClick={() => setShowAIAgentModal(true)}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              {t('sessions.call_ai_agent')}
            </Button>
          </div>
        </div>

       </div>


      {/* Session Transcription */}
      <Card>
        <CardHeader className="py-4 px-6"> {/* Reduced vertical padding, kept horizontal */}
          <CardTitle className="flex items-center justify-between text-base"> {/* Reduced font size from default */}
            {t('sessions.session_transcription')}
            {isSaving && (
              <div className="flex items-center text-sm" style={{ color: 'var(--brand-primary)' }}>
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                {t('common.saving')}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6"> {/* Added horizontal and bottom padding to match header */}
          {/* Processing feedback - show when uploading/transcribing or when there's info message */}
          {isProcessingAudio && (
            <Alert className="mb-4" style={{
              borderColor: processingError ? '#3b82f6' : 'var(--brand-tertiary)',
              backgroundColor: processingError ? '#dbeafe' : 'var(--brand-tertiary-bg)'
            }}>
              <div className="flex items-center gap-3">
                {!processingError && (
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-b-2"
                    style={{ borderBottomColor: 'var(--brand-tertiary)' }}
                  />
                )}
                {processingError && (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <p className="font-semibold" style={{ color: processingError ? '#2563eb' : 'var(--brand-primary)' }}>
                    {processingMessage}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {processingError
                      ? t('sessions.transcription_warnings.empty_warning_message')
                      : t('sessions.recording.wait_message')
                    }
                  </p>
                </div>
              </div>
            </Alert>
          )}

          <Textarea
            placeholder={t('sessions.placeholders.transcription')}
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="min-h-96 resize-none font-mono"
          />
        </CardContent>
      </Card>

      {/* Audio Upload Modal */}
      <AudioUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onTranscriptionComplete={handleTranscriptionComplete}
      />

      {/* AI Agent Modal */}
      <AIAgentModal
        open={showAIAgentModal}
        onClose={() => setShowAIAgentModal(false)}
        transcription={transcription}
        patient={selectedPatient || createdPatient}
        sessionId={session?.id}
        patientId={(selectedPatient || createdPatient)?.id}
        onCreateSessionAndQuote={handleNewSessionAndQuote}
        onCreateClinicalReport={handleNewClinicalReport}
      />

      {/* Template Quote Modal */}
      <TemplateQuoteModal
        open={showTemplateQuoteModal}
        onClose={() => setShowTemplateQuoteModal(false)}
        transcription={transcription}
        patient={selectedPatient || createdPatient}
        sessionId={session?.id}
        onQuoteCreated={handleTemplateQuoteCreated}
        onClinicalNoteCreated={handleTemplateClinicalNoteCreated}
        onPreventionCreated={handleTemplatePreventionCreated}
      />

      {/* Session Link Toast */}
      {toastData && (
        <LinkToast
          show={showLinkToast}
          itemNumber={toastData.itemNumber}
          itemId={toastData.itemId}
          onClose={() => setShowLinkToast(false)}
          type={toastData.type}
        />
      )}

      {/* Workflow Help Modal */}
      <Modal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title={t('sessions.workflow_guide.modal_title')}
        size="xl"
      >
        <div className="px-6 pt-4 pb-6">
          {/* Introduction */}
          <p className="text-gray-600 mb-8">
            {t('sessions.workflow_guide.intro')}
          </p>

          {/* Step 1 - Transcription */}
          <div className="flex gap-4 pb-6 border-b border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center text-white font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('sessions.workflow_guide.step1_title')}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {t('sessions.workflow_guide.step1_detail')}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-700">
                  <strong>{t('sessions.workflow_guide.tip')}:</strong> {t('sessions.workflow_guide.step1_tip')}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 - Patient */}
          <div className="flex gap-4 py-6 border-b border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center text-white font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('sessions.workflow_guide.step2_title')}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {t('sessions.workflow_guide.step2_detail')}
              </p>
              <div className="bg-purple-50 rounded-lg p-3 text-sm border border-purple-100">
                <p className="text-gray-700 mb-2">
                  <strong>{t('sessions.workflow_guide.step2_search_title')}:</strong> {t('sessions.workflow_guide.step2_search')}
                </p>
                <p className="text-gray-700">
                  <strong>{t('sessions.workflow_guide.step2_create_title')}:</strong> {t('sessions.workflow_guide.step2_create')}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 - Session */}
          <div className="flex gap-4 py-6 border-b border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center text-white font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('sessions.workflow_guide.step3_title')}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {t('sessions.workflow_guide.step3_detail')}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-700">
                  <strong>{t('sessions.workflow_guide.step3_button')}:</strong> {t('sessions.workflow_guide.step3_button_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 - Documents */}
          <div className="flex gap-4 pt-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center text-white font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('sessions.workflow_guide.step4_title')}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {t('sessions.workflow_guide.step4_detail')}
              </p>
              <div className="space-y-2">
                <div className="bg-pink-50 rounded-lg p-3 text-sm border border-pink-100">
                  <p className="text-gray-700 mb-1">
                    <strong className="text-[#E91E63]">{t('sessions.workflow_guide.step4_template_title')}</strong>
                  </p>
                  <p className="text-gray-600">{t('sessions.workflow_guide.step4_template_desc')}</p>
                </div>
                {/* AI Agent Section - Enhanced with visual button and config link */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm mb-1">
                        {t('sessions.workflow_guide.step4_agent_title')}
                      </p>
                      <p className="text-gray-600 text-sm mb-3">{t('sessions.workflow_guide.step4_agent_desc')}</p>

                      {/* Visual representation of the button */}
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-[5px] text-sm font-medium cursor-default mb-3" style={{ fontFamily: 'Montserrat, sans-serif', height: '32px' }}>
                        <Bot className="w-4 h-4" />
                        {t('sessions.call_ai_agent')}
                      </div>

                      {/* Config hint and link */}
                      <p className="text-xs text-gray-600 mb-2">
                        {t('sessions.workflow_guide.step4_agent_config_hint')}
                      </p>
                      <a
                        href="/configurations/ai-agent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#B725B7] hover:text-[#9a1f9a] font-medium flex items-center gap-1"
                      >
                        {t('sessions.workflow_guide.step4_agent_config_link')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Draft Auto-Save Tip */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {t('sessions.workflow_guide.draft_title')}
                </h4>
                <p className="text-gray-600 text-sm">
                  {t('sessions.workflow_guide.draft_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-end mt-8">
            <Button variant="primary" onClick={() => setShowHelpModal(false)}>
              {t('sessions.workflow_guide.got_it')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}