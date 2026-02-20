import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Headphones,
  User,
  Loader2,
  Trash2,
  MessageCircle,
  Mail
} from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Input,
  Alert,
  AlertDescription
} from '@client/common/ui'
import { supportAgentService, SupportChatMessage } from '../../services/supportAgentService'

interface SupportAgentModalProps {
  open: boolean
  onClose: () => void
}

export const SupportAgentModal: React.FC<SupportAgentModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation('tq')
  const [messages, setMessages] = useState<SupportChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load history when modal opens
  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open])

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const history = await supportAgentService.getHistory()
      setMessages(history)
    } catch {
      // Silent fail — start fresh
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return

    const text = userInput.trim()
    setUserInput('')
    setError(null)

    // Optimistically add user message
    const optimistic: SupportChatMessage[] = [
      ...messages,
      { role: 'user', content: text, timestamp: new Date().toISOString() }
    ]
    setMessages(optimistic)
    setIsLoading(true)

    try {
      const result = await supportAgentService.sendMessage(text)
      setMessages(result.messages)
    } catch {
      setError(t('modals.support_agent.failed_to_send'))
      // Remove optimistic message on error
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = async () => {
    try {
      await supportAgentService.clearHistory()
      setMessages([])
      setError(null)
    } catch {
      setError(t('modals.support_agent.failed_to_load'))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!open) return null

  const whatsappNumber = '5511966874759'
  const email = 'admin@livocare.ai'

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
          className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] max-h-[700px] flex flex-col mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Headphones className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('modals.support_agent.title')}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="text-gray-400 hover:text-red-500 p-2"
                  title={t('modals.support_agent.clear_chat')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              /* Welcome message */
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Headphones className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('modals.support_agent.title')}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {t('modals.support_agent.welcome_message')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) =>
                  message.role === 'assistant' ? (
                    <div key={`a-${index}`} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <Headphones className="w-4 h-4 text-teal-600" />
                        </div>
                      </div>
                      <Card className="flex-1">
                        <CardContent className="p-3">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 m-0" style={{ lineHeight: '1.7' }}>
                            {message.content}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div key={`u-${index}`} className="flex gap-3 justify-end">
                      <Card className="flex-1 max-w-md bg-teal-50 border-teal-100">
                        <CardContent className="p-3">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 m-0" style={{ lineHeight: '1.7' }}>
                            {message.content}
                          </pre>
                        </CardContent>
                      </Card>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-tertiary-bg, #f3e8ff)' }}>
                          <User className="w-4 h-4" style={{ color: 'var(--brand-tertiary, #B725B7)' }} />
                        </div>
                      </div>
                    </div>
                  )
                )}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      </div>
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-3">
                        <div className="text-sm text-gray-500">{t('modals.support_agent.ai_thinking')}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer: Input + Contact link */}
          <div className="border-t border-gray-200">
            <div className="p-4">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  placeholder={t('modals.support_agent.placeholder')}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 min-w-0"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="px-4 flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Human support link */}
            <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>{t('modals.support_agent.contact_human')}</span>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1 text-[#B725B7] hover:text-[#9B1E9B] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
