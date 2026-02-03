/**
 * Media Library Component for Hub App
 *
 * Allows tenants to upload images and videos for use in Puck components.
 * Limit: 15 files per tenant (images + videos combined)
 */

import React, { useCallback, useRef, useState, useEffect, DragEvent } from 'react'
import { Upload, Image as ImageIcon, Video, Trash2, AlertCircle, Loader, Film, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Alert, AlertDescription, Progress } from '@client/common/ui'
import { brandingService, MediaLibraryItem } from '../../services/brandingService'

const ACCEPTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
const ACCEPTED_VIDEO_FORMATS = ['video/mp4']
const ACCEPTED_FORMATS = [...ACCEPTED_IMAGE_FORMATS, ...ACCEPTED_VIDEO_FORMATS]
const MAX_IMAGE_SIZE_MB = 5
const MAX_VIDEO_SIZE_MB = 20
const MAX_FILES = 20
const ITEMS_PER_PAGE = 6

export const MediaLibrary: React.FC = () => {
  const { t } = useTranslation('hub')
  const [media, setMedia] = useState<MediaLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [count, setCount] = useState(0)
  const [deleteInProgress, setDeleteInProgress] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load media library
  const loadMedia = useCallback(async () => {
    try {
      setLoading(true)
      const response = await brandingService.getMediaLibrary()
      // Response can be either the array directly (if interceptor unwraps)
      // or { data: [...], meta: {...} }
      let mediaData: MediaLibraryItem[] = []
      let totalCount = 0

      if (Array.isArray(response)) {
        // Response is already the array
        mediaData = response
        totalCount = response.length
      } else if (response && Array.isArray(response.data)) {
        // Response is { data: [...], meta: {...} }
        mediaData = response.data
        totalCount = response.meta?.count || response.data.length
      }

      const validMedia = mediaData.filter((item: any) => item && item.id && item.mediaType)
      setMedia(validMedia)
      setCount(totalCount || validMedia.length)
    } catch (err) {
      console.error('[MediaLibrary] Failed to load media library:', err)
      setError(t('media_library.error_loading'))
      // Set empty state on error
      setMedia([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return t('media_library.invalid_format')
    }

    const isImage = ACCEPTED_IMAGE_FORMATS.includes(file.type)
    const maxSizeMB = isImage ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB
    const fileSizeMB = file.size / (1024 * 1024)

    if (fileSizeMB > maxSizeMB) {
      return isImage
        ? t('media_library.image_too_large', { max: MAX_IMAGE_SIZE_MB })
        : t('media_library.video_too_large', { max: MAX_VIDEO_SIZE_MB })
    }

    return null
  }, [t])

  // Handle file upload
  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    if (count >= MAX_FILES) {
      setError(t('media_library.limit_reached', { max: MAX_FILES }))
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(30)

    try {
      setUploadProgress(60)
      await brandingService.uploadMediaLibraryItem(file)
      setUploadProgress(100)

      // Reload media from server to get fresh data
      await loadMedia()

      // Go to first page to show the new upload
      setCurrentPage(1)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.response?.data?.message || t('media_library.upload_failed'))
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [validateFile, count, t, loadMedia])

  // Handle file input change (supports multiple files)
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Upload files sequentially
      for (const file of Array.from(files)) {
        await handleUpload(file)
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleUpload])

  // Handle drag & drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Upload files sequentially
      for (const file of Array.from(files)) {
        await handleUpload(file)
      }
    }
  }, [handleUpload])

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm(t('media_library.delete_confirm'))) return

    setDeleteInProgress(id)
    try {
      await brandingService.deleteMediaLibraryItem(id)
      setMedia(prev => prev.filter(m => m.id !== id))
      setCount(prev => prev - 1)

      // Adjust current page if needed
      const newCount = count - 1
      const totalPages = Math.ceil(newCount / ITEMS_PER_PAGE)
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages)
      }
    } catch (err) {
      console.error('Delete failed:', err)
      setError(t('media_library.delete_failed'))
    } finally {
      setDeleteInProgress(null)
    }
  }, [t, count, currentPage])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Pagination
  const totalPages = Math.ceil(media.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentMedia = media.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-[#B725B7]" />
        <span className="ml-2 text-gray-600">{t('media_library.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{t('media_library.description')}</p>
        </div>
        <div className="text-sm font-medium text-gray-700">
          {count}/{MAX_FILES} {t('media_library.files')}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* Upload area */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading || count >= MAX_FILES}
        multiple
      />

      {uploading ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-[#B725B7] mb-2" />
          <p className="text-sm text-gray-600 mb-2">{t('media_library.uploading')}</p>
          <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
        </div>
      ) : count >= MAX_FILES ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{t('media_library.limit_reached', { max: MAX_FILES })}</p>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${isDragOver
              ? 'border-[#B725B7] bg-purple-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragOver ? t('media_library.drop_here') : t('media_library.drag_drop')}
          </p>
          <p className="text-xs text-gray-500">
            {t('media_library.formats_hint')}
          </p>
        </div>
      )}

      {/* Media grid */}
      {media.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {currentMedia.map((item) => (
              <div
                key={item.id}
                className="relative group border border-gray-200 rounded overflow-hidden bg-gray-50 aspect-square"
              >
                {item.mediaType === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.altText || item.originalFilename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                    <Film className="h-8 w-8 mb-2" />
                    <span className="text-xs text-center px-2 truncate w-full">
                      {item.originalFilename}
                    </span>
                  </div>
                )}

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    disabled={deleteInProgress === item.id}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                    title={t('media_library.delete')}
                  >
                    {deleteInProgress === item.id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="flex items-center gap-1 text-white">
                    {item.mediaType === 'image' ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}
                    <span className="text-xs truncate flex-1">{item.originalFilename}</span>
                  </div>
                  <span className="text-xs text-gray-300">{formatFileSize(item.fileSize)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
          <p>{t('media_library.empty')}</p>
        </div>
      )}
    </div>
  )
}

export default MediaLibrary
