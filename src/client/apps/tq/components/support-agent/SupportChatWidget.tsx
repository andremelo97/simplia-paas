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
  Minus,
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

interface SupportChatWidgetProps {
  open: boolean
  onClose: () => void
}

export const SupportChatWidget: React.FC<SupportChatWidgetProps> = ({ open, onClose }) => {
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

  // Load history when widget opens
  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open])

  // Focus input when widget opens
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

  const whatsappNumber = '5511966874759'
  const email = 'admin@livocare.ai'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.35 }}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] max-h-[calc(100vh-8rem)] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Headphones className="w-4 h-4 text-teal-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                {t('modals.support_agent.title')}
              </h2>
            </div>
            <div className="flex items-center gap-0.5">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="text-gray-400 hover:text-red-500 p-1.5 h-auto"
                  title={t('modals.support_agent.clear_chat')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 h-auto"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto">
            {error && (
              <Alert className="mb-3">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              /* Welcome message */
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                  <Headphones className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  {t('modals.support_agent.title')}
                </h3>
                <p className="text-xs text-gray-500 max-w-[280px]">
                  {t('modals.support_agent.welcome_message')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) =>
                  message.role === 'assistant' ? (
                    <div key={`a-${index}`} className="flex gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                          <Headphones className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                      </div>
                      <Card className="flex-1">
                        <CardContent className="p-2.5">
                          <pre className="whitespace-pre-wrap font-sans text-xs text-gray-800 m-0" style={{ lineHeight: '1.6' }}>
                            {message.content}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div key={`u-${index}`} className="flex gap-2 justify-end">
                      <Card className="flex-1 max-w-[280px] bg-teal-50 border-teal-100">
                        <CardContent className="p-2.5">
                          <pre className="whitespace-pre-wrap font-sans text-xs text-gray-800 m-0" style={{ lineHeight: '1.6' }}>
                            {message.content}
                          </pre>
                        </CardContent>
                      </Card>
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-tertiary-bg, #f3e8ff)' }}>
                          <User className="w-3.5 h-3.5" style={{ color: 'var(--brand-tertiary, #B725B7)' }} />
                        </div>
                      </div>
                    </div>
                  )
                )}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                      </div>
                    </div>
                    <Card className="flex-1">
                      <CardContent className="p-2.5">
                        <div className="text-xs text-gray-500">{t('modals.support_agent.ai_thinking')}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer: Input + Contact link */}
          <div className="border-t border-gray-200 flex-shrink-0">
            <div className="p-3">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder={t('modals.support_agent.placeholder')}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 min-w-0 text-sm h-9"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="px-3 flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white h-9"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Human support link */}
            <div className="px-3 pb-2.5 flex items-center justify-center gap-3 text-[11px] text-gray-400">
              <span>{t('modals.support_agent.contact_human')}</span>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1 text-[#B725B7] hover:text-[#9B1E9B] transition-colors"
              >
                <Mail className="w-3 h-3" />
                Email
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
