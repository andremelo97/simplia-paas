/**
 * MediaPickerField - Custom Puck field for selecting media from tenant library
 *
 * Allows users to:
 * 1. Select images/videos from their media library
 * 2. Toggle to use an external URL instead
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Image, Video, Link, X, Loader, ExternalLink, Library } from 'lucide-react'
import { mediaLibraryService, MediaLibraryItem } from '../../../services/mediaLibrary'

interface MediaPickerFieldProps {
  value: string
  onChange: (value: string) => void
  mediaType: 'image' | 'video'
}

export const MediaPickerField: React.FC<MediaPickerFieldProps> = ({
  value,
  onChange,
  mediaType
}) => {
  const [showModal, setShowModal] = useState(false)
  const [useUrl, setUseUrl] = useState(false)
  const [media, setMedia] = useState<MediaLibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if current value is from library or external URL
  const isExternalUrl = value && (value.startsWith('http://') || value.startsWith('https://'))
  const isLibraryUrl = value && value.includes('supabase')

  // Load media when modal opens
  const loadMedia = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await mediaLibraryService.getMediaLibrary(mediaType)
      // Response can be array directly or { data: [...] }
      const mediaData = Array.isArray(response) ? response : (response?.data || [])
      setMedia(mediaData)
    } catch (err) {
      console.error('Failed to load media library:', err)
      setError('Failed to load media library')
    } finally {
      setLoading(false)
    }
  }, [mediaType])

  useEffect(() => {
    if (showModal) {
      loadMedia()
    }
  }, [showModal, loadMedia])

  const handleSelect = (item: MediaLibraryItem) => {
    onChange(item.url)
    setShowModal(false)
  }

  const handleClear = () => {
    onChange('')
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // Get selected media info for display
  const selectedMedia = media?.find(m => value && m.url === value)

  return (
    <div className="space-y-2">
      {/* Mode Toggle */}
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => setUseUrl(false)}
          className={`px-2 py-1 rounded flex items-center gap-1 ${
            !useUrl
              ? 'bg-[#B725B7] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Library className="h-3 w-3" />
          Library
        </button>
        <button
          type="button"
          onClick={() => setUseUrl(true)}
          className={`px-2 py-1 rounded flex items-center gap-1 ${
            useUrl
              ? 'bg-[#B725B7] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ExternalLink className="h-3 w-3" />
          URL
        </button>
      </div>

      {useUrl ? (
        /* URL Input Mode */
        <div>
          <input
            type="text"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder={mediaType === 'image' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#B725B7] focus:border-[#B725B7]"
          />
        </div>
      ) : (
        /* Library Mode */
        <div>
          {/* Selected Preview */}
          {value ? (
            <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {mediaType === 'image' ? (
                <img
                  src={value}
                  alt="Selected"
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 bg-gray-900 flex items-center justify-center">
                  <Video className="h-8 w-8 text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
              {selectedMedia && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <span className="text-xs text-white truncate block">
                    {selectedMedia.originalFilename}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full px-3 py-4 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#B725B7] hover:text-[#B725B7] transition-colors flex items-center justify-center gap-2"
            >
              {mediaType === 'image' ? (
                <Image className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              Select from Library
            </button>
          )}

          {/* Change button when selected */}
          {value && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              Change selection
            </button>
          )}
        </div>
      )}

      {/* Media Library Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-medium">
                Select {mediaType === 'image' ? 'Image' : 'Video'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-6 w-6 animate-spin text-[#B725B7]" />
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  {error}
                </div>
              ) : !media || media.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Image className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>No {mediaType}s in library</p>
                  <p className="text-xs mt-1">
                    Upload {mediaType}s in Hub &gt; Branding &gt; Media Library
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        value === item.url
                          ? 'border-[#B725B7] ring-2 ring-[#B725B7]/20'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {item.mediaType === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.altText || item.originalFilename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white">
                          <Video className="h-6 w-6 mb-1" />
                          <span className="text-xs px-1 truncate w-full text-center">
                            {item.originalFilename}
                          </span>
                        </div>
                      )}
                      {value === item.url && (
                        <div className="absolute inset-0 bg-[#B725B7]/20 flex items-center justify-center">
                          <div className="bg-[#B725B7] text-white rounded-full p-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaPickerField
