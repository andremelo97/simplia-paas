import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Textarea,
  Badge,
  Alert,
  AlertDescription,
  Select
} from '@client/common/ui'
import { sessionsService, Session } from '../../services/sessions'
import { getSessionStatusColor, getSessionStatusLabel, SESSION_STATUS_OPTIONS, SessionStatus } from '../../types/sessionStatus'

export const EditSession: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [transcription, setTranscription] = useState('')
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.DRAFT)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      if (!id) {
        setLoadError('Session ID is required')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log('📄 [EditSession] Loading session data for ID:', id)
        const sessionData = await sessionsService.getSession(id)
        console.log('✅ [EditSession] Session data loaded:', sessionData)

        setSession(sessionData)
        // Load transcription text if available
        setTranscription(sessionData.transcription_text || '')
        // Load status
        setStatus(sessionData.status as SessionStatus)
      } catch (err: any) {
        console.error('❌ [EditSession] Failed to load session:', err)

        if (err.status === 404) {
          setLoadError('Session not found')
        } else if (err.status >= 500) {
          setLoadError('Server error. Please try again later.')
        } else {
          setLoadError('Failed to load session data. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session || !id) return

    setIsSubmitting(true)

    try {
      console.log('📄 [EditSession] Saving session:', session.id)

      // Update session with new status and transcription text
      const updatedSession = await sessionsService.updateSession(session.id, {
        status: status,
        transcription_text: transcription
      })

      // Update local session data
      setSession(updatedSession)
      // Update transcription state to reflect saved changes
      setTranscription(updatedSession.transcription_text || '')

      console.log('✅ [EditSession] Session updated successfully')
      // Success feedback is handled automatically by HTTP interceptor
    } catch (err: any) {
      console.error('❌ [EditSession] Failed to save session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/sessions')
  }

  const handleBackToList = () => {
    navigate('/sessions')
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const handleStatusChange = (newStatus: SessionStatus) => {
    setStatus(newStatus)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
          <p className="text-gray-600 mt-1">Loading session data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B725B7]"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert" aria-live="assertive">
          <div className="flex items-center">
            <div className="text-red-800">
              <h3 className="font-medium">Error Loading Session</h3>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <Button variant="secondary" onClick={handleBackToList}>
              Back to List
            </Button>
            <Button variant="default" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
        </div>
        <Alert>
          <AlertDescription>
            Session not found
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const patientName = session.patient_first_name || session.patient_last_name
    ? `${session.patient_first_name || ''} ${session.patient_last_name || ''}`.trim()
    : 'Unknown Patient'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Session</h1>
        <p className="text-gray-600 mt-1">
          Session {session.number} • {patientName}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Session Details */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Session Details</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Session Number"
                  value={session.number}
                  disabled
                  helperText="Unique session identifier"
                />

                <div>
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as SessionStatus)}
                    options={SESSION_STATUS_OPTIONS}
                    disabled={isSubmitting}
                    helperText="Current session status"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Created At"
                  value={new Date(session.created_at).toLocaleString()}
                  disabled
                  helperText="When this session was created"
                />

                <Input
                  label="Last Updated"
                  value={new Date(session.updated_at).toLocaleString()}
                  disabled
                  helperText="When this session was last updated"
                />
              </div>

              <Input
                label="Patient"
                value={patientName}
                disabled
                helperText="Patient associated with this session"
              />
            </CardContent>
          </Card>

          {/* Transcription */}
          <Card>
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Transcription</h2>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-6">
              <Textarea
                label="Transcription Content"
                placeholder="Transcription content will appear here..."
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="min-h-96 resize-none font-mono"
                helperText="Edit the transcription content"
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
            style={{ height: '32px', minHeight: '32px' }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}