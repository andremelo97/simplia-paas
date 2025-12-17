/**
 * Image Upload Modal Component for Hub App
 *
 * Modal component for uploading logo images with drag & drop support,
 * file validation, and upload progress tracking for tenant branding.
 */

import React, { useCallback, useRef, useState, DragEvent } from 'react'
import { Upload, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, Button, Progress, Alert, AlertDescription } from '@client/common/ui'
import { brandingService } from '../../services/brandingService'

interface ImageUploadModalProps {
  open: boolean
  onClose: () => void
  onUploadComplete?: (imageUrl: string) => void
  className?: string
}

const ACCEPTED_FORMATS = ['.png', '.jpg', '.jpeg', '.svg']
const MAX_SIZE_MB = 5

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  open,
  onClose,
  onUploadComplete,
  className = ''
}) => {
  const { t } = useTranslation('hub')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setIsDragOver(false)
      setIsUploading(false)
      setUploadProgress(0)
      setUploadComplete(false)
      setError(null)
      setPreviewUrl(null)
    }
  }, [open])

  // Validate file type and size
  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ACCEPTED_FORMATS.some(format =>
      fileName.endsWith(format.toLowerCase())
    )

    if (!hasValidExtension) {
      return `${t('branding.upload_modal_invalid_type')}: ${ACCEPTED_FORMATS.join(', ')}`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_SIZE_MB) {
      return `${t('branding.upload_modal_file_too_large')}: ${MAX_SIZE_MB}MB`
    }

    // Check if it's actually an image file (basic MIME type check)
    if (!file.type.startsWith('image/')) {
      return t('branding.upload_modal_not_image')
    }

    return null
  }, [t])

  // Handle file processing
  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(25)

    // Generate preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      // Simulate upload progress
      setUploadProgress(50)

      // Upload via service
      const result = await brandingService.uploadLogo(file)

      setUploadProgress(100)
      setUploadComplete(true)

      // Call callback with logo URL
      if (onUploadComplete && result.logoUrl) {
        onUploadComplete(result.logoUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, onUploadComplete])

  // Handle file input change
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  // Handle drag & drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (imageFile) {
      processFile(imageFile)
    } else if (files.length > 0) {
      setError(t('branding.upload_modal_drop_image'))
    }
  }, [processFile, t])

  // Handle browse button click
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null)
    setUploadProgress(0)
    setUploadComplete(false)
    setPreviewUrl(null)
  }, [])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('branding.upload_modal_title')}
      description={t('branding.upload_modal_description')}
      size="md"
      showCloseButton={!isUploading}
    >
      <div className={`p-6 ${className}`}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {/* Upload Area - Idle State */}
        {!isUploading && !uploadComplete && !error && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragOver
                ? 'border-[#B725B7] bg-purple-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragOver ? t('branding.upload_modal_drop_here') : t('branding.upload_modal_upload_logo')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('branding.upload_modal_drag_drop')}
            </p>
            <Button variant="primary" className="mb-2">
              <Upload className="w-4 h-4 mr-2" />
              {t('branding.upload_modal_choose_file')}
            </Button>
            <p className="text-xs text-gray-500">
              {t('branding.upload_modal_supported_formats')}: {ACCEPTED_FORMATS.join(', ')} • {t('branding.upload_modal_max_size')}: {MAX_SIZE_MB}MB
            </p>
          </div>
        )}

        {/* Upload Progress State */}
        {isUploading && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-32 max-w-full object-contain border border-gray-200 rounded"
                />
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Loader className="h-5 w-5 animate-spin text-[#B725B7]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('branding.upload_modal_uploading')}
                </p>
                <Progress value={uploadProgress} className="h-2 mt-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {t('branding.upload_modal_please_wait')}
            </p>
          </div>
        )}

        {/* Success State */}
        {uploadComplete && (
          <div className="text-center space-y-4">
            {previewUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={previewUrl}
                  alt="Uploaded"
                  className="max-h-32 max-w-full object-contain border border-gray-200 rounded"
                />
              </div>
            )}
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">{t('branding.upload_modal_complete')}</h3>
              <p className="text-gray-600 mt-1">
                {t('branding.upload_modal_success')}
              </p>
            </div>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {t('branding.upload_modal_saved')}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center pt-4">
              <Button variant="primary" onClick={onClose}>
                {t('branding.upload_modal_close')}
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={handleRetry}>
                {t('branding.upload_modal_try_again')}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                {t('branding.upload_modal_cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Footer - Action Buttons */}
        {!isUploading && !uploadComplete && !error && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={onClose}>
              {t('branding.upload_modal_cancel')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ImageUploadModal
