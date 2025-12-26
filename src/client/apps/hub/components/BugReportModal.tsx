import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Button, Textarea, Label } from '@client/common/ui'
import { Upload, X, Image, Video, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { api } from '@client/config/http'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AttachmentFile {
  file: File
  preview: string
  type: 'image' | 'video'
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('hub')
  const { user, tenantName } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Format current date
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const subject = `[Bug Report] ${tenantName || 'Unknown'} - ${currentDate}`

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate and add files
    const newAttachments: AttachmentFile[] = []

    for (const file of files) {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue
      }

      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError(t('bug_report.error_file_too_large', { name: file.name }))
        continue
      }

      // Check max attachments
      if (attachments.length + newAttachments.length >= 5) {
        setError(t('bug_report.error_max_files'))
        break
      }

      // Create preview URL
      const preview = URL.createObjectURL(file)
      newAttachments.push({
        file,
        preview,
        type: file.type.startsWith('image/') ? 'image' : 'video'
      })
    }

    setAttachments(prev => [...prev, ...newAttachments])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [attachments.length, t])

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev]
      // Revoke preview URL to prevent memory leak
      URL.revokeObjectURL(newAttachments[index].preview)
      newAttachments.splice(index, 1)
      return newAttachments
    })
  }, [])

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError(t('bug_report.error_description_required'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('description', description)

      for (const attachment of attachments) {
        formData.append('attachments', attachment.file)
      }

      await api.post('/internal/api/v1/bug-reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Success - close modal and reset state
      handleClose()
    } catch (err) {
      console.error('Bug report submission failed:', err)
      setError(t('bug_report.error_submit_failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Cleanup preview URLs
    for (const attachment of attachments) {
      URL.revokeObjectURL(attachment.preview)
    }

    // Reset state
    setDescription('')
    setAttachments([])
    setError(null)

    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={t('bug_report.title')}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* User Info (readonly) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-500 text-sm">{t('bug_report.from')}</Label>
            <p className="text-gray-900 font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-gray-500 text-sm">{t('bug_report.tenant')}</Label>
            <p className="text-gray-900 font-medium">{tenantName || 'N/A'}</p>
          </div>
        </div>

        {/* Subject (readonly) */}
        <div>
          <Label className="text-gray-500 text-sm">{t('bug_report.subject')}</Label>
          <p className="text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
            {subject}
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-gray-700 font-medium">
            {t('bug_report.description')} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('bug_report.description_placeholder')}
            className="mt-1 min-h-[150px]"
          />
        </div>

        {/* Attachments */}
        <div>
          <Label className="text-gray-700 font-medium mb-2 block">
            {t('bug_report.attachments')}
            <span className="text-gray-400 font-normal ml-2">
              ({attachments.length}/5)
            </span>
          </Label>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {attachments.map((att, index) => (
                <div
                  key={index}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Video className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 5}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('bug_report.add_attachment')}
          </Button>

          <p className="text-xs text-gray-500 mt-2">
            {t('bug_report.attachment_help')}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('common:cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('bug_report.submitting')}
              </>
            ) : (
              t('bug_report.submit')
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
