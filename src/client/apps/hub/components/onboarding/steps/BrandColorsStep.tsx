import React from 'react'
import { useTranslation } from 'react-i18next'
import { Palette, Lightbulb, Play } from 'lucide-react'
import { BrandingData } from '../../../services/brandingService'

interface BrandColorsStepProps {
  branding: BrandingData
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>
}

export const BrandColorsStep: React.FC<BrandColorsStepProps> = ({ branding, setBranding }) => {
  const { t } = useTranslation('hub')

  return (
    <>
      {/* Left Column - Explanation */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.brand_colors.title', 'Brand Colors')}
          </h2>
        </div>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t('onboarding.brand_colors.description', 'These colors are used in email templates and landing pages. Choose colors that match your brand identity.')}
        </p>

        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white mb-6">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.brand_colors.video_placeholder', 'Tutorial video coming soon')}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-auto">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {t('onboarding.brand_colors.tip', "Default colors are LivoCare's brand colors. You can reset them anytime from Settings.")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Color Pickers */}
      <div className="flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t('onboarding.brand_colors.right_title', 'Pick your colors')}
        </h3>

        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              {t('onboarding.brand_colors.primary_color', 'Primary Color')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.primaryColor || '#000000'}
                onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.primaryColor || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#B725B7"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#B725B7] focus:border-transparent"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              {t('onboarding.brand_colors.secondary_color', 'Secondary Color')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.secondaryColor || '#000000'}
                onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.secondaryColor || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                placeholder="#E91E63"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#B725B7] focus:border-transparent"
              />
            </div>
          </div>

          {/* Tertiary Color */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              {t('onboarding.brand_colors.tertiary_color', 'Tertiary Color')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={branding.tertiaryColor || '#000000'}
                onChange={(e) => setBranding(prev => ({ ...prev, tertiaryColor: e.target.value }))}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.tertiaryColor || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, tertiaryColor: e.target.value }))}
                placeholder="#5ED6CE"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#B725B7] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-6">
          <label className="block text-base font-medium text-gray-700 mb-2">
            {t('onboarding.brand_colors.preview', 'Preview')}
          </label>
          <div className="flex gap-3">
            <div
              className="w-16 h-16 rounded-lg border border-gray-200"
              style={{ backgroundColor: branding.primaryColor || '#B725B7' }}
            />
            <div
              className="w-16 h-16 rounded-lg border border-gray-200"
              style={{ backgroundColor: branding.secondaryColor || '#E91E63' }}
            />
            <div
              className="w-16 h-16 rounded-lg border border-gray-200"
              style={{ backgroundColor: branding.tertiaryColor || '#5ED6CE' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
