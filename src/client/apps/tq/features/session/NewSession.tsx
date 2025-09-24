import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Mic,
  Play,
  Pause,
  User,
  Save,
  AlertCircle,
  Upload,
  Plus
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
  DropdownMenuItem
} from '@client/common/ui'
import { useAuthStore } from '../../shared/store'
import { sessionsService, Session } from '../../services/sessions'
import { patientsService, Patient } from '../../services/patients'
import { publishFeedback } from '@client/common/feedback'

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
  const { user } = useAuthStore()

  // Mock session data (static for now)
  const [session] = useState<Session>({
    id: 1,
    status: 'draft',
    transcription: '',
    duration: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const [isLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [transcription, setTranscription] = useState('')
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

  // UI state for dropdown and patient flow
  const [transcribeMode, setTranscribeMode] = useState<'start' | 'upload'>('start')
  const [patientMode, setPatientMode] = useState<'search' | 'create'>('search')
  const [patientName, setPatientName] = useState('')

  // Dropdown is now handled by the DropdownMenu component

  // Simulate autosave without API calls (for now)
  const debouncedTranscription = useDebouncedValue(transcription, 2000)

  // Simulate autosave feedback (for now)
  useEffect(() => {
    if (!debouncedTranscription || debouncedTranscription === session.transcription) return

    // Simulate saving
    setIsSaving(true)
    const timeout = setTimeout(() => {
      setIsSaving(false)
      console.log('Mock: Transcription saved locally')
    }, 500)

    return () => clearTimeout(timeout)
  }, [debouncedTranscription, session.transcription])

  // Patient search removed - using simplified UI now

  // Audio devices are now mocked above - no API calls needed

  // Mock VU meter
  useEffect(() => {
    if (!isTranscribing) {
      setVuLevel(0)
      return
    }

    const interval = setInterval(() => {
      // Simular VU meter com valores aleatórios
      setVuLevel(Math.random() * 100)
    }, 100)

    return () => clearInterval(interval)
  }, [isTranscribing])

  // Handlers (mocked for now)
  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'completed') => {
    // Mock status change
    console.log('Mock: Status changed to', newStatus)
    // In real implementation, this would call API
  }

  // New handlers for simplified UI
  const handleTranscribeModeSelect = (mode: 'start' | 'upload') => {
    setTranscribeMode(mode)
    console.log('Mock: Transcribe mode changed to:', mode)
    // Just change the mode - user needs to click main button to start
  }

  const handlePatientModeToggle = () => {
    if (patientMode === 'search') {
      setPatientMode('create')
      setPatientName('')
    } else {
      // For now, just stay in create mode - future: save and reset
      console.log('Mock: Save patient:', patientName)
    }
  }


  const toggleTranscribing = () => {
    setIsTranscribing(prev => {
      const newState = !prev
      if (newState) {
        timer.start()
        if (session?.status === 'draft') {
          handleStatusChange('active')
        }
      } else {
        timer.pause()
      }
      return newState
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
            placeholder="Select microphone"
            className="w-40"
          />

          {/* Transcribing Button Group - When NOT recording */}
          {!isTranscribing && (
            <div className="flex items-center bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm transition-colors">
              {/* Main Action Button */}
              <Button
                onClick={toggleTranscribing}
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

          {/* Stop Button - When recording */}
          {isTranscribing && (
            <Button
              onClick={toggleTranscribing}
              variant="destructive"
              size="lg"
              className="font-semibold"
            >
              <Pause className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
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

        {/* Input and CTA button in same line, tightly grouped */}
        <div className="flex items-center gap-3 w-fit">
          <Input
            placeholder={
              patientMode === 'search'
                ? "Search patient by name…"
                : "Enter patient name…"
            }
            value={patientMode === 'search' ? '' : patientName}
            onChange={(e) => {
              if (patientMode === 'create') {
                setPatientName(e.target.value)
              }
              // In search mode, no action needed for now (static)
            }}
            className="w-80 bg-white flex-shrink-0" // Fixed compact width with white background, no shrinking
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePatientModeToggle}
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
                Save
              </>
            )}
          </Button>
        </div>

      </div>

      {/* Session Transcription */}
      <Card>
        <CardHeader className="py-4 px-6"> {/* Reduced vertical padding, kept horizontal */}
          <CardTitle className="flex items-center justify-between text-base"> {/* Reduced font size from default */}
            Session Transcription
            {isSaving && (
              <div className="flex items-center text-sm text-blue-600">
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                Saving...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6"> {/* Added horizontal and bottom padding to match header */}
          <Textarea
            placeholder="Start transcribing... Your text will be automatically saved."
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="min-h-96 resize-none font-mono"
          />
        </CardContent>
      </Card>
    </div>
  )
}