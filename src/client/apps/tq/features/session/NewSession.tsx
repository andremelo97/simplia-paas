import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Mic,
  Play,
  Pause,
  Square,
  User,
  Save,
  AlertCircle,
  Upload,
  Plus,
  Bot
} from 'lucide-react'
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
  AlertDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  LinkToast
} from '@client/common/ui'
import { useAuthStore } from '../../shared/store'
import { sessionsService, Session } from '../../services/sessions'
import { patientsService, Patient } from '../../services/patients'
import { quotesService, CreateQuoteRequest } from '../../services/quotes'
import { clinicalReportsService } from '../../services/clinicalReports'
import { aiAgentService } from '../../services/aiAgentService'
import { publishFeedback } from '@client/common/feedback'
import { parsePatientName } from '../../lib/parsePatientName'
import { plainTextToHtml } from '../../lib/textToHtml'
import { AudioUploadModal } from '../../components/new-session/AudioUploadModal'
import { TemplateQuoteModal } from '../../components/new-session/TemplateQuoteModal'
import { AIAgentModal } from '../../components/ai-agent/AIAgentModal'
import { useTranscription } from '../../hooks/useTranscription'
import { transcriptionService } from '../../services/transcriptionService'

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

  // Audio upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)

  // AI Agent modal state
  const [showAIAgentModal, setShowAIAgentModal] = useState(false)

  // Template Quote modal state
  const [showTemplateQuoteModal, setShowTemplateQuoteModal] = useState(false)

  // Link toast state
  const [showLinkToast, setShowLinkToast] = useState(false)
  const [toastData, setToastData] = useState<{itemId: string, itemNumber: string, type: 'session' | 'quote' | 'clinical-report'} | null>(null)

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

  // Dropdown is now handled by the DropdownMenu component

  // Simulate autosave without API calls (for now)
  const debouncedTranscription = useDebouncedValue(transcription, 2000)

  // Debounced search query
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Handle transcription completion from hook
  useEffect(() => {
    if (transcriptionState.status === 'completed' && transcriptionState.transcript) {
      publishFeedback({
        kind: 'success',
        code: 'TRANSCRIPTION_COMPLETED',
        message: `Transcription completed with ${Math.round((transcriptionState.confidenceScore || 0) * 100)}% confidence`
      })
    } else if (transcriptionState.status === 'failed' && transcriptionState.error) {
      publishFeedback({
        kind: 'error',
        code: 'TRANSCRIPTION_FAILED',
        message: transcriptionState.error
      })
    }
  }, [transcriptionState.status, transcriptionState.transcript, transcriptionState.error, transcriptionState.confidenceScore])

  // Simulate autosave feedback (for now)
  useEffect(() => {
    if (!debouncedTranscription || debouncedTranscription === session?.transcription) return

    // Simulate saving
    setIsSaving(true)
    const timeout = setTimeout(() => {
      setIsSaving(false)
      console.log('Mock: Transcription saved locally')
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
        console.error('Failed to search patients:', error)
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
      console.log('🔄 [NewSession] Patient changed - resetting session')
      setSession(null)
      setSessionContext({ patientId: null, transcriptionId: null })
      setCreatedTranscriptionId(null)
      return
    }

    // Check if transcription changed significantly (only if we have a transcription ID)
    if (currentTranscriptionId && sessionContext.transcriptionId !== currentTranscriptionId) {
      console.log('🔄 [NewSession] Transcription changed - resetting session')
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

  // Handlers (mocked for now)
  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'completed') => {
    // Mock status change
    console.log('Mock: Status changed to', newStatus)
    // In real implementation, this would call API
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
      console.error('❌ [CreateSession] Failed to create session:', error)
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
      console.error('❌ [CreateSession] Failed to create session with transcription:', error)
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
      console.log('📝 [ensureSession] Creating transcription...')
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
      console.log('🔄 [ensureSession] Context changed, creating new session...')
      console.log('  Patient:', patient.id, '(previous:', sessionContext.patientId, ')')
      console.log('  Transcription:', currentTranscriptionId, '(previous:', sessionContext.transcriptionId, ')')

      // Create new session
      const newSession = await createSessionWithTranscription(patient.id, currentTranscriptionId)

      // Update context
      setSessionContext({
        patientId: patient.id,
        transcriptionId: currentTranscriptionId
      })

      console.log('✅ [ensureSession] New session created:', newSession.number)
      return newSession
    }

    // Reuse existing session
    console.log('♻️  [ensureSession] Reusing existing session:', session.number)
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
      console.log('✅ [NewSession] Session created successfully:', newSession.number)
      // Success feedback is handled automatically by HTTP interceptor

      // Show session link toast
      setToastData({
        itemId: newSession.id,
        itemNumber: newSession.number,
        type: 'session'
      })
      setShowLinkToast(true)

    } catch (error) {
      console.error('❌ [NewSession] Failed to create session:', error)
      // Error feedback is handled automatically by HTTP interceptor
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Handle New Session & Quote button click
  const handleNewSessionAndQuote = async (aiSummary?: string) => {
    console.log('🟢 [NewSession] handleNewSessionAndQuote called')
    console.log('  - transcription:', transcription.substring(0, 50))
    console.log('  - aiSummary:', aiSummary ? aiSummary.substring(0, 50) : 'none')

    // If called from AI Agent, aiSummary will be provided and we should use it
    // If called from button, transcription should exist
    if (!transcription.trim() && !aiSummary) {
      console.log('⚠️ [NewSession] No transcription or AI summary available')
      return
    }

    const patient = selectedPatient || createdPatient
    if (!patient) {
      console.log('⚠️ [NewSession] No patient selected')
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
      console.log('✅ [NewSession] Using session:', currentSession.number)

      // Create the quote using the session ID
      console.log('💰 [NewSession] Creating quote for session:', currentSession.id)
      const rawContent = aiSummary || transcription // Use AI summary if provided, otherwise fallback to transcription
      console.log('📄 [NewSession] Quote content source:', aiSummary ? 'AI Summary' : 'Transcription')
      
      // Convert plain text to HTML for TipTap editor (preserves line breaks and paragraphs)
      const htmlContent = plainTextToHtml(rawContent)

      const quoteData: CreateQuoteRequest = {
        sessionId: currentSession.id,
        content: htmlContent,
        status: 'draft'
      }
      const newQuote = await quotesService.createQuote(quoteData)
      console.log('✅ [NewSession] Quote created successfully:', newQuote.number)

      // Show quote link toast (redirects to /quotes)
      setToastData({
        itemId: newQuote.id,
        itemNumber: newQuote.number,
        type: 'quote'
      })
      setShowLinkToast(true)

    } catch (error) {
      console.error('❌ [NewSession] Failed to create quote:', error)
      // Error feedback is handled automatically by HTTP interceptor
    }
  }

  // Handle Clinical Report creation from AI Agent
  const handleNewClinicalReport = async (aiSummary: string) => {
    console.log('🟢 [NewSession] handleNewClinicalReport called')
    console.log('  - transcription:', transcription.substring(0, 50))
    console.log('  - aiSummary:', aiSummary ? aiSummary.substring(0, 50) : 'none')

    // If called from AI Agent, aiSummary will be provided and we should use it
    // If called from button, transcription should exist
    if (!transcription.trim() && !aiSummary) {
      console.log('⚠️ [NewSession] No transcription or AI summary available')
      return
    }

    const patient = selectedPatient || createdPatient
    if (!patient) {
      console.log('⚠️ [NewSession] No patient selected')
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
      console.log('✅ [NewSession] Using session:', currentSession.number)

      // Create the clinical report using the session ID
      console.log('📋 [NewSession] Creating clinical report for session:', currentSession.id)
      const rawContent = aiSummary || transcription
      console.log('📄 [NewSession] Clinical report content source:', aiSummary ? 'AI Summary' : 'Transcription')
      
      // Convert plain text to HTML for TipTap editor (preserves line breaks and paragraphs)
      const htmlContent = plainTextToHtml(rawContent)

      const reportData = {
        sessionId: currentSession.id,
        content: htmlContent
      }
      const newReport = await clinicalReportsService.create(reportData)
      console.log('✅ [NewSession] Clinical report created successfully:', newReport)

      // Defensive: check if report has required fields
      if (!newReport || !newReport.id || !newReport.number) {
        console.error('⚠️ [NewSession] Invalid report response:', newReport)
        throw new Error('Invalid clinical report response from API')
      }

      // Show LinkToast for navigation (not publishFeedback - feedback is automatic)
      setToastData({
        itemId: newReport.id,
        itemNumber: newReport.number,
        type: 'clinical-report'
      })
      setShowLinkToast(true)

    } catch (error) {
      console.error('❌ [NewSession] Failed to create clinical report:', error)
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
    console.log('💰 [NewSession] Creating quote with template:', templateId)
    // TODO: Implement template-based quote creation
    // This will use the AI Template Filler endpoint to fill the template
    // and then create a quote with the filled content
  }

  // Handle Template Quote creation callback
  const handleTemplateQuoteCreated = (quoteId: string, quoteNumber: string) => {
    console.log('✅ [NewSession] Template quote created:', quoteNumber)
    // Show quote link toast (redirects to /quotes)
    setToastData({
      itemId: quoteId,
      itemNumber: quoteNumber,
      type: 'quote'
    })
    setShowLinkToast(true)
  }

  const handleTemplateCreateClinicalReport = async (templateId: string) => {
    console.log('📄 [NewSession] Creating clinical report with template:', templateId)

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

      console.log('🔮 [NewSession] Filling template with AI for clinical report:', fillTemplateRequest)
      const filledTemplateResponse = await aiAgentService.fillTemplate(fillTemplateRequest)
      console.log('✅ [NewSession] Template filled successfully')

      // Create clinical report with filled template content
      const reportData = {
        sessionId: session.id,
        content: filledTemplateResponse.filledTemplate
      }

      console.log('📋 [NewSession] Creating clinical report with filled template')
      const newReport = await clinicalReportsService.create(reportData)
      console.log('✅ [NewSession] Clinical report created successfully:', newReport)

      // Defensive: check if report has required fields
      if (!newReport || !newReport.id || !newReport.number) {
        console.error('⚠️ [NewSession] Invalid report response:', newReport)
        throw new Error('Invalid clinical report response from API')
      }

      // Show LinkToast for navigation
      setToastData({
        itemId: newReport.id,
        itemNumber: newReport.number,
        type: 'clinical-report'
      })
      setShowLinkToast(true)

    } catch (error) {
      console.error('❌ [NewSession] Failed to create clinical report with template:', error)
      // Error feedback is handled automatically by HTTP interceptor
    }
  }

  // Handle transcription completion callback from the modal
  const handleTranscriptionComplete = useCallback((transcript: string, transcriptionId: string) => {
    console.log('Transcription completed with ID:', transcriptionId)
    console.log('Transcription text:', transcript)

    // Update the transcription field with the result
    setTranscription(transcript)

    // Show success feedback
    publishFeedback({
      kind: 'success',
      code: 'TRANSCRIPTION_COMPLETED',
      title: 'Transcription Complete',
      message: 'Audio file has been transcribed successfully.',
      path: '/tq/new-session'
    })
  }, [])

  // New handlers for simplified UI
  const handleTranscribeModeSelect = (mode: 'start' | 'upload') => {
    setTranscribeMode(mode)
    console.log('Mock: Transcribe mode changed to:', mode)
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
          code: 'PATIENT_CREATED',
          message: `Patient "${patientName}" created successfully`
        })

        // Keep the patient selected in the input with green border
        setCreatedPatient(newPatient)
        // Don't reset patientName - keep it showing the created patient
        // Don't change back to search mode - stay in create mode but disabled


        console.log('Patient created successfully:', newPatient)

      } catch (error) {
        console.error('Failed to create patient:', error)

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


  const toggleTranscribing = () => {
    if (!isTranscribing) {
      // Start transcribing
      setIsTranscribing(true)
      setIsPaused(false)
      timer.start()
      if (session?.status === 'draft') {
        handleStatusChange('active')
      }
    } else if (!isPaused) {
      // Pause transcribing
      setIsPaused(true)
      timer.pause()
    } else {
      // Resume transcribing
      setIsPaused(false)
      timer.start()
    }
  }

  const stopTranscribing = () => {
    setIsTranscribing(false)
    setIsPaused(false)
    timer.pause()
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
          <h1 className="text-2xl font-bold text-gray-900">New Session</h1>
          <p className="text-gray-600 mt-1">
            Create and record a new transcription session
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
                className="font-semibold rounded-r-none border-r-0 bg-transparent hover:bg-transparent shadow-none border-0 text-white"
              >
                {transcribeMode === 'start' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Transcribing
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
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
                      Upload Audio
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleTranscribeModeSelect('start')}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Transcribing
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
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
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
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200" />

      {/* Patient Details Section - Simplified (no Card wrapper) */}
      <div className="space-y-4"> {/* Adjusted internal spacing */}
        {/* Title with icon */}
        <h2 className="flex items-center text-lg font-semibold text-gray-900">
          <User className="w-5 h-5 mr-2" />
          Add Patient Details
        </h2>

        {/* Input and buttons in same line - left side: patient input, right side: action buttons */}
        <div className="flex items-center justify-between w-full">
          {/* Left side: Patient input and create button */}
          <div className="flex items-center gap-3">
            <div ref={searchContainerRef} className="relative w-80">
              <Input
                placeholder={
                  patientMode === 'search'
                    ? "Search patient by name…"
                    : "Enter patient name…"
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
                Patient created successfully
              </div>
            ) : selectedPatient ? (
              <div className="flex items-center gap-1 text-[var(--brand-tertiary)] font-medium flex-shrink-0 whitespace-nowrap">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Patient selected
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
                    Create new patient
                  </>
                ) : (
                  <>
                    {isCreatingPatient ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-1" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Save
                      </>
                    )}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex items-center gap-3">
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    New Session
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
              onClick={() => {
                console.log('🔵 [NewSession] Opening Template Quote Modal')
                setShowTemplateQuoteModal(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Quote or Clinical
            </Button>

            {/* Call AI Agent - Only enabled after session created */}
            <Button
              variant="primary"
              disabled={!isQuoteOrReportEnabled()}
              onClick={() => {
                console.log('🔵 [NewSession] Opening AI Agent Modal')
                setShowAIAgentModal(true)
              }}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Call AI Agent
            </Button>
          </div>
        </div>

       </div>


      {/* Session Transcription */}
      <Card>
        <CardHeader className="py-4 px-6"> {/* Reduced vertical padding, kept horizontal */}
          <CardTitle className="flex items-center justify-between text-base"> {/* Reduced font size from default */}
            Session Transcription
            {isSaving && (
              <div className="flex items-center text-sm" style={{ color: 'var(--brand-primary)' }}>
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                Saving...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6"> {/* Added horizontal and bottom padding to match header */}
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
        onCreateQuote={handleTemplateCreateQuote}
        onCreateClinicalReport={handleTemplateCreateClinicalReport}
        onQuoteCreated={handleTemplateQuoteCreated}
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
    </div>
  )
}