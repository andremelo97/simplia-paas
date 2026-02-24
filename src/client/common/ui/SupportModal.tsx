import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { MessageCircle, Mail, Copy, Check, Headphones, Clock, Bot, ArrowRight, ShieldCheck, Zap, BookOpen } from 'lucide-react'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAIChat?: () => void
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, onOpenAIChat }) => {
  const { t } = useTranslation('common')
  const whatsappNumber = '5511966874759'
  const whatsappDisplay = '+55 11 96687-4759'
  const email = 'admin@livocare.ai'

  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const handleCopy = async (value: string, type: 'whatsapp' | 'email') => {
    await navigator.clipboard.writeText(value)
    if (type === 'whatsapp') {
      setCopiedWhatsapp(true)
      setTimeout(() => setCopiedWhatsapp(false), 2000)
    } else {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('support_modal.title')}
      description={t('support_modal.description')}
      size={onOpenAIChat ? 'xl' : 'md'}
    >
      <div className={`p-6 ${onOpenAIChat ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}`}>
        {/* Left Column: Human Support */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {t('support_modal.human_support_title')}
          </h3>

          {/* How we help */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">{t('support_modal.how_we_help')}</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full flex-shrink-0"></span>
                {t('support_modal.help_templates')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full flex-shrink-0"></span>
                {t('support_modal.help_questions')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full flex-shrink-0"></span>
                {t('support_modal.help_integrations')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full flex-shrink-0"></span>
                {t('support_modal.help_feedback')}
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {t('support_modal.response_time')}
              </p>
            </div>
          </div>

          {/* Contact channels */}
          <p className="text-sm font-medium text-gray-700">{t('support_modal.contact_channels')}</p>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 flex-1"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('support_modal.whatsapp')}</p>
                <p className="text-xs text-gray-500">{whatsappDisplay}</p>
              </div>
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopy(whatsappDisplay, 'whatsapp')
              }}
              className="p-1.5 rounded-md hover:bg-green-100 transition-colors"
              title={t('support_modal.copy')}
            >
              {copiedWhatsapp ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#B725B7] hover:bg-purple-50 transition-all group">
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 flex-1"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Mail className="w-5 h-5 text-[#B725B7]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('support_modal.email')}</p>
                <p className="text-xs text-gray-500">{email}</p>
              </div>
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopy(email, 'email')
              }}
              className="p-1.5 rounded-md hover:bg-purple-100 transition-colors"
              title={t('support_modal.copy')}
            >
              {copiedEmail ? (
                <Check className="w-4 h-4 text-[#B725B7]" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Agent */}
        {onOpenAIChat && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {t('support_modal.ai_agent')}
            </h3>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('support_modal.ai_agent')}</p>
                  <p className="text-xs text-teal-600 font-medium">{t('support_modal.ai_available')}</p>
                </div>
              </div>

              {/* What it can do */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-500" />
                  {t('support_modal.ai_can_do')}
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-5">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_help_navigate')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_help_features')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_help_troubleshoot')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_help_tips')}
                  </li>
                </ul>
              </div>

              {/* What it cannot do */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  {t('support_modal.ai_cannot_do')}
                </p>
                <ul className="text-xs text-gray-500 space-y-1 ml-5">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_no_actions')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_no_data')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0"></span>
                    {t('support_modal.ai_no_billing')}
                  </li>
                </ul>
              </div>

              {/* Source note */}
              <p className="text-[0.6875rem] text-gray-400 flex items-center gap-1.5 pt-1">
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                {t('support_modal.ai_source_note')}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => {
                  onClose()
                  onOpenAIChat()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Headphones className="w-4 h-4" />
                {t('support_modal.ai_start_chat')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
