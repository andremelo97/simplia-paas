import React, { useState } from 'react'
import { Modal } from './Modal'
import { MessageCircle, Mail, Copy, Check } from 'lucide-react'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
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
      title="Suporte"
      description="Entre em contato conosco por WhatsApp ou e-mail"
      size="sm"
    >
      <div className="p-6 space-y-4">
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
              <p className="font-medium text-gray-900">WhatsApp</p>
              <p className="text-sm text-gray-600">{whatsappDisplay}</p>
            </div>
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy(whatsappDisplay, 'whatsapp')
            }}
            className="p-2 rounded-md hover:bg-green-100 transition-colors"
            title="Copiar"
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
              <p className="font-medium text-gray-900">E-mail</p>
              <p className="text-sm text-gray-600">{email}</p>
            </div>
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy(email, 'email')
            }}
            className="p-2 rounded-md hover:bg-purple-100 transition-colors"
            title="Copiar"
          >
            {copiedEmail ? (
              <Check className="w-5 h-5 text-[#B725B7]" />
            ) : (
              <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
