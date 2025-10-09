import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Bot,
  User,
  Receipt,
  FileText,
  Loader2
} from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Input,
  Alert,
  AlertDescription
} from '@client/common/ui'
import { aiAgentService, ChatMessage, Patient } from '../../services/aiAgentService'

interface AIAgentModalProps {
  open: boolean
  onClose: () => void
  transcription: string
  patient: Patient | null
  sessionId?: string
  patientId?: string
  onCreateSessionAndQuote: (aiSummary: string) => void
  onCreateClinicalReport: (aiSummary: string) => void
}

export const AIAgentModal: React.FC<AIAgentModalProps> = ({
  open,
  onClose,
  transcription,
  patient,
  sessionId,
  patientId,
  onCreateSessionAndQuote,
  onCreateClinicalReport
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize conversation when modal opens
  useEffect(() => {
    if (open && !hasInitialized && transcription.trim()) {
      initializeConversation()
    }
  }, [open, hasInitialized, transcription])

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMessages([])
      setIsLoading(false)
      setUserInput('')
      setError(null)
      setHasInitialized(false)
    }
  }, [open])

  const initializeConversation = async () => {
    if (!transcription.trim()) {
      setError('No transcription available to analyze')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Send EMPTY messages to backend - backend will resolve system message and add it
      // Backend gets full transcription via sessionId and resolves all variables
      const result = await aiAgentService.sendMessage([], sessionId, patientId)
      
      // Backend returns the resolved system message - use it for display
      // Replace full transcription with truncated version for UI
      let displaySystemMessage = result.systemMessageUsed || 'Processing transcription...'
      
      if (result.systemMessageUsed && transcription) {
        // Get first 3 words of transcription for preview
        const words = transcription.trim().split(/\s+/)
        const transcriptionPreview = words.length > 3 
          ? words.slice(0, 3).join(' ') + '...'
          : transcription
        
        // Replace full transcription with preview in display message
        displaySystemMessage = displaySystemMessage.replace(
          new RegExp(transcription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          transcriptionPreview
        )
      }
      
      // Create display messages with resolved system message (transcription truncated)
      const displayMessages = [{ role: 'user' as const, content: displaySystemMessage }]
      const updatedMessages = aiAgentService.addAIResponse(displayMessages, result.response)
      setMessages(updatedMessages)
      setHasInitialized(true)
    } catch (error) {
      console.error('Failed to initialize AI conversation:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate summary')
    } finally {
      setIsLoading(false)
    }
  }

  const sendUserMessage = async () => {
    if (!userInput.trim() || isLoading) return

    const userMessage = userInput.trim()
    setUserInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Add user message to conversation
      const messagesWithUser = aiAgentService.addUserMessage(messages, userMessage)
      setMessages(messagesWithUser)

      // Get AI response
      const result = await aiAgentService.sendMessage(messagesWithUser, sessionId, patientId)
      const finalMessages = aiAgentService.addAIResponse(messagesWithUser, result.response)
      setMessages(finalMessages)
    } catch (error) {
      console.error('Failed to send message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendUserMessage()
    }
  }

  const handleCreateSessionAndQuote = (aiSummary: string) => {
    onCreateSessionAndQuote(aiSummary)
    // Keep modal open so user can continue using AI Agent
  }

  const handleCreateClinicalReport = (aiSummary: string) => {
    onCreateClinicalReport(aiSummary)
    // Keep modal open so user can continue using AI Agent
  }


  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] max-h-[800px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Medical Summary</h2>
                <p className="text-sm text-gray-600">
                  Creating treatment summary for {patient ?
                    `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient' :
                    'Patient'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {messages.map((message, index) => (
                message.role === 'assistant' ? (
                  <div key={`assistant-${index}`} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800" style={{ lineHeight: '1.8' }}>
                            {message.content}
                          </pre>
                        </div>

                        {/* Action buttons for every AI response */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                          <Button
                            onClick={() => {
                              console.log('🟣 [AIAgentModal] Create Quote button clicked')
                              handleCreateSessionAndQuote(message.content)
                            }}
                            variant="primary"
                            className="flex items-center gap-2"
                          >
                            <Receipt className="w-4 h-4" />
                            Create Quote
                          </Button>
                          <Button
                            onClick={() => {
                              console.log('🟣 [AIAgentModal] Create Clinical Report button clicked')
                              handleCreateClinicalReport(message.content)
                            }}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Create Clinical Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div key={`user-${index}`} className="flex gap-3 justify-end">
                    <Card className="flex-1 max-w-2xl">
                      <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 m-0" style={{ lineHeight: '1.8' }}>
                          {message.content}
                        </pre>
                      </CardContent>
                    </Card>
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-tertiary-bg)' }}>
                        <User className="w-4 h-4" style={{ color: 'var(--brand-tertiary)' }} />
                      </div>
                    </div>
                  </div>
                )
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                    </div>
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">AI is thinking...</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          {hasInitialized && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  placeholder="Ask the AI to modify the summary, add sections, or make changes..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 min-w-0"
                />
                <Button
                  onClick={sendUserMessage}
                  disabled={!userInput.trim() || isLoading}
                  variant="primary"
                  className="px-6 flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}