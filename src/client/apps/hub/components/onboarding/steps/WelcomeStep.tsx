import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  CheckCircle2,
  Rocket,
  LayoutGrid,
  Settings,
  ShoppingBag,
  Play,
} from 'lucide-react'

interface WelcomeStepProps {
  tenantName: string
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ tenantName }) => {
  const { t } = useTranslation('hub')

  return (
    <>
      {/* Left Column - What is Hub */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {t('onboarding.welcome.title', 'Welcome to Hub!')}
            </h2>
            <p className="text-base text-gray-500">{tenantName}</p>
          </div>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.welcome.hub_description',
            'Hub is your central management portal. From here you can launch your licensed applications, customize your brand, manage your team, and explore templates — all in one place.'
          )}
        </p>

        {/* Hub Feature Cards */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3.5 bg-purple-50 rounded-lg border border-purple-100">
            <div className="w-9 h-9 rounded-lg bg-[#B725B7] flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                {t('onboarding.welcome.feature_apps_title', 'App Launcher')}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                {t(
                  'onboarding.welcome.feature_apps_desc',
                  'Access all your licensed applications from the home screen. Single sign-on means no extra logins — just click and go.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-pink-50 rounded-lg border border-pink-100">
            <div className="w-9 h-9 rounded-lg bg-[#E91E63] flex items-center justify-center flex-shrink-0">
              <Settings className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                {t('onboarding.welcome.feature_config_title', 'Configurations')}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                {t(
                  'onboarding.welcome.feature_config_desc',
                  'Customize your branding (logo, colors, contact info), configure email delivery, manage your media library, and control user access.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-teal-50 rounded-lg border border-teal-100">
            <div className="w-9 h-9 rounded-lg bg-[#5ED6CE] flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                {t('onboarding.welcome.feature_marketplace_title', 'Marketplace')}
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                {t(
                  'onboarding.welcome.feature_marketplace_desc',
                  'Browse curated templates by specialty and import them to your TQ with one click. Ready-to-use documents and landing pages.'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-auto">
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {t(
                  'onboarding.welcome.ready_title',
                  'Your system is 100% functional.'
                )}
              </p>
              <p className="text-sm text-green-700 mt-0.5">
                {t(
                  'onboarding.welcome.ready_description',
                  'These settings are optional but recommended. You can skip this wizard and configure everything later from the Settings page.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - What we'll set up + video */}
      <div className="flex flex-col gap-5">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            {t('onboarding.welcome.setup_title', "What we'll set up:")}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t(
              'onboarding.welcome.intro',
              'This wizard will guide you through setting up your brand identity. Configure your logo, colors, contact information, and media to personalize your experience.'
            )}
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-base text-gray-700">
                {t('onboarding.welcome.setup_logo', 'Upload your company logo')}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-base text-gray-700">
                {t('onboarding.welcome.setup_colors', 'Set your brand colors')}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-base text-gray-700">
                {t(
                  'onboarding.welcome.setup_contact',
                  'Add company contact information'
                )}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-base text-gray-700">
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
