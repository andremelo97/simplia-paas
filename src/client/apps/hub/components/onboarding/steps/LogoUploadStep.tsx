import React, { useCallback, useRef, useState, DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
} from 'lucide-react'
import { BrandingData } from '../../../services/brandingService'
import { brandingService } from '../../../services/brandingService'

const ACCEPTED_FORMATS = ['.png', '.jpg', '.jpeg', '.svg']
const MAX_SIZE_MB = 5

interface LogoUploadStepProps {
  branding: BrandingData
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>
}

export const LogoUploadStep: React.FC<LogoUploadStepProps> = ({
  branding,
  setBranding,
}) => {
  const { t } = useTranslation('hub')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      const fileName = file.name.toLowerCase()
      const hasValidExtension = ACCEPTED_FORMATS.some((format) =>
        fileName.endsWith(format)
      )

      if (!hasValidExtension) {
        return t('onboarding.logo_step.invalid_type', {
          defaultValue: `Invalid file type. Accepted formats: ${ACCEPTED_FORMATS.join(', ')}`,
        })
      }

      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > MAX_SIZE_MB) {
        return t('onboarding.logo_step.file_too_large', {
          defaultValue: `File too large. Maximum size: ${MAX_SIZE_MB}MB`,
        })
      }

      if (!file.type.startsWith('image/')) {
        return t('onboarding.logo_step.not_image', 'The selected file is not a valid image.')
      }

      return null
    },
    [t]
  )

  const processFile = useCallback(
    async (file: File) => {
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
        setUploadProgress(50)

        const result = await brandingService.uploadLogo(file)

        setUploadProgress(100)

        if (result.logoUrl) {
          setBranding((prev) => ({ ...prev, logoUrl: result.logoUrl }))
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('onboarding.logo_step.upload_failed', 'Upload failed. Please try again.')
        )
        setUploadProgress(0)
      } finally {
        setIsUploading(false)
      }
    },
    [validateFile, setBranding, t]
  )

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        processFile(file)
      }
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((file) => file.type.startsWith('image/'))

      if (imageFile) {
        processFile(imageFile)
      } else if (files.length > 0) {
        setError(
          t('onboarding.logo_step.drop_image', 'Please drop an image file.')
        )
      }
    },
    [processFile, t]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    setUploadProgress(0)
    setPreviewUrl(null)
  }, [])

  return (
    <>
      {/* Left Column - Explanation */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.logo_step.title', 'Your Logo')}
          </h2>
        </div>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t(
            'onboarding.logo_step.description',
            'Your logo appears on emails and landing pages sent to your clients. A clear, high-quality image ensures your brand looks professional.'
          )}
        </p>

        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mb-4">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.logo_step.video_placeholder', 'Tutorial video coming soon')}
          </p>
        </div>

        <p className="text-base text-gray-500">
          {t(
            'onboarding.logo_step.supported_formats',
            'Supported formats: PNG, JPEG, SVG. Max 5MB.'
          )}
        </p>
      </div>

      {/* Right Column - Upload Area */}
      <div className="flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t('onboarding.logo_step.right_title', 'Upload it here')}
        </h3>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {/* State: Current logo exists and not uploading */}
        {branding.logoUrl && !isUploading && !error && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full border border-gray-200 rounded-lg p-6 bg-white flex items-center justify-center">
              <img
                src={branding.logoUrl}
                alt={t('onboarding.logo_step.logo_preview_alt', 'Current logo')}
                className="max-h-40 max-w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{t('onboarding.logo_step.logo_uploaded', 'Logo uploaded successfully')}</span>
            </div>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#B725B7] bg-white border border-[#B725B7] rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t('onboarding.logo_step.replace_logo', 'Replace Logo')}
            </button>
          </div>
        )}

        {/* State: Idle (no logo, not uploading, no error) */}
        {!branding.logoUrl && !isUploading && !error && (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[17.5rem]
              ${
                isDragOver
                  ? 'border-[#B725B7] bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-700 font-medium mb-1">
              {isDragOver
                ? t('onboarding.logo_step.drop_here', 'Drop your image here')
                : t(
                    'onboarding.logo_step.drag_drop',
                    'Drag and drop an image file, or click to browse'
                  )}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {t(
                'onboarding.logo_step.formats_hint',
                'PNG, JPEG, SVG up to 5MB'
              )}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B725B7] rounded-lg hover:bg-[#9a1f9a] transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseClick()
              }}
            >
              <Upload className="w-4 h-4" />
              {t('onboarding.logo_step.choose_file', 'Choose File')}
            </button>
          </div>
        )}

        {/* State: Uploading */}
        {isUploading && (
          <div className="flex flex-col items-center gap-4 p-8">
            {previewUrl && (
              <div className="w-full border border-gray-200 rounded-lg p-4 bg-white flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt={t('onboarding.logo_step.preview_alt', 'Preview')}
                  className="max-h-32 max-w-full object-contain opacity-60"
                />
              </div>
            )}
            <div className="flex items-center gap-3 w-full">
              <Loader2 className="w-5 h-5 animate-spin text-[#B725B7] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.logo_step.uploading', 'Uploading...')}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-[#B725B7] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State: Error */}
        {error && (
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B725B7] rounded-lg hover:bg-[#9a1f9a] transition-colors"
            >
              {t('onboarding.logo_step.try_again', 'Try Again')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
