import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, CheckCircle2, Rocket, Play } from 'lucide-react'

interface WelcomeStepProps {
  tenantName: string
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ tenantName }) => {
  const { t } = useTranslation('hub')

  return (
    <>
      {/* Left Column - Welcome */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('onboarding.welcome.title', 'Welcome to Hub!')}
            </h2>
            <p className="text-sm text-gray-500">{tenantName}</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.welcome.intro',
            'This wizard will guide you through setting up your brand identity. Configure your logo, colors, contact information, and media to personalize your experience.'
          )}
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-auto">
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {t(
                  'onboarding.welcome.ready_title',
                  'Your system is 100% functional.'
                )}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {t(
                  'onboarding.welcome.ready_description',
                  'These settings are optional but recommended. You can skip this wizard and configure everything later from the Settings page.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - What we'll set up */}
      <div className="flex flex-col gap-6">
        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t('onboarding.welcome.setup_title', "What we'll set up:")}
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t('onboarding.welcome.setup_logo', 'Upload your company logo')}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t('onboarding.welcome.setup_colors', 'Set your brand colors')}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t(
                  'onboarding.welcome.setup_contact',
                  'Add company contact information'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {t(
                  'onboarding.welcome.setup_media',
                  'Upload background media for public pages'
                )}
              </span>
            </li>
          </ul>
        </div>

        <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-white">
          <Play className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">
            {t('onboarding.welcome.video_placeholder', 'Tutorial video coming soon')}
          </p>
        </div>
      </div>
    </>
  )
}
