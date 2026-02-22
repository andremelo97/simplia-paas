import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Info, Play } from 'lucide-react'
import { MediaLibrary } from '../../configurations/MediaLibrary'

export const MediaLibraryStep: React.FC = () => {
  const { t } = useTranslation('hub')

  return (
    <>
      {/* Left Column - Explanation */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Image className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.media.title', 'Media Library')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.media.description',
            'Upload images and videos to use as backgrounds on your public quote pages. These are used in the landing page editor.'
          )}
        </p>

        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mb-6">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.media.video_placeholder', 'Tutorial video coming soon')}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p>{t('onboarding.media.limit_images', 'Images: PNG, JPEG, SVG (max 5MB)')}</p>
              <p>{t('onboarding.media.limit_videos', 'Videos: MP4 (max 20MB)')}</p>
              <p>{t('onboarding.media.limit_count', 'Up to 20 files per tenant')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Media Library */}
      <div className="flex flex-col">
        <MediaLibrary />
      </div>
    </>
  )
}
