import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { MessageCircle, Mail, Copy, Check, Headphones } from 'lucide-react'

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
      size="md"
    >
      <div className="p-6 space-y-4">
        {/* What we help with */}
        <div className="bg-gray-50 rounded-lg p-4 mb-2">
          <p className="text-sm font-medium text-gray-700 mb-2">{t('support_modal.how_we_help')}</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full"></span>
              {t('support_modal.help_templates')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full"></span>
              {t('support_modal.help_questions')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full"></span>
              {t('support_modal.help_integrations')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#B725B7] rounded-full"></span>
              {t('support_modal.help_feedback')}
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              {t('support_modal.business_hours')}
            </p>
            <p className="text-xs text-gray-400 mt-1 ml-3">
              {t('support_modal.outside_hours')}
            </p>
          </div>
        </div>

        {/* Contact channels label */}
        <p className="text-sm font-medium text-gray-700 pt-2">{t('support_modal.contact_channels')}</p>

        {/* WhatsApp */}
        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 flex-1"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('support_modal.whatsapp')}</p>
              <p className="text-sm text-gray-600">{whatsappDisplay}</p>
            </div>
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy(whatsappDisplay, 'whatsapp')
            }}
            className="p-2 rounded-md hover:bg-green-100 transition-colors"
            title={t('support_modal.copy')}
          >
            {copiedWhatsapp ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* Email */}
        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#B725B7] hover:bg-purple-50 transition-all group">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-4 flex-1"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Mail className="w-6 h-6 text-[#B725B7]" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('support_modal.email')}</p>
              <p className="text-sm text-gray-600">{email}</p>
            </div>
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy(email, 'email')
            }}
            className="p-2 rounded-md hover:bg-purple-100 transition-colors"
            title={t('support_modal.copy')}
          >
            {copiedEmail ? (
              <Check className="w-5 h-5 text-[#B725B7]" />
            ) : (
              <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
        </div>

        {/* AI Support Agent */}
        {onOpenAIChat && (
          <button
            onClick={() => {
              onClose()
              onOpenAIChat()
            }}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
              <Headphones className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('support_modal.ai_agent')}</p>
              <p className="text-sm text-gray-600">{t('support_modal.ai_agent_description')}</p>
            </div>
          </button>
        )}
      </div>
    </Modal>
  )
}
