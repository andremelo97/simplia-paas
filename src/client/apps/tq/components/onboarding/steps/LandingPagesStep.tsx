import React from 'react'
import { useTranslation } from 'react-i18next'
import { Layout, Link2, Palette, CheckCircle2, ArrowRight } from 'lucide-react'

export const LandingPagesStep: React.FC = () => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Landing Pages overview */}
      <div className="flex flex-col">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Layout className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.landing_pages.title', 'Landing Pages')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t(
            'onboarding.landing_pages.description',
            'Create beautiful, branded pages to share documents with your patients. They can view quotes and prevention plans without needing to log in.'
          )}
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-700" />
            {t('onboarding.landing_pages.links_title', 'Links')}
          </h4>
          <p className="text-sm text-gray-600">
            {t(
              'onboarding.landing_pages.links_desc',
              'Generate unique public URLs for each document. Manage active links, set password protection, and configure expiration dates.'
            )}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-700" />
            {t('onboarding.landing_pages.templates_title', 'Page Templates')}
          </h4>
          <p className="text-sm text-gray-600">
            {t(
              'onboarding.landing_pages.templates_desc',
              'Design the visual layout of your landing pages using a drag-and-drop builder. Add headers, footers, tables, buttons, and more.'
            )}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-amber-800">
            {t(
              'onboarding.landing_pages.advanced_tip',
              'This is an advanced feature. Default templates are provided — customize them when you\'re ready.'
            )}
          </p>
        </div>
      </div>

      {/* Right Column - Features */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.landing_pages.features_title', 'Features')}
        </h3>

        <div className="bg-gray-50 rounded-xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t(
                'onboarding.landing_pages.feature_builder',
                'Drag-and-drop visual page builder (Puck)'
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t(
                'onboarding.landing_pages.feature_branding',
                'Custom branding (logo, colors from Hub)'
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t(
                'onboarding.landing_pages.feature_password',
                'Password protection for sensitive documents'
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t(
                'onboarding.landing_pages.feature_email',
                'Shareable links sent via email'
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t(
                'onboarding.landing_pages.feature_responsive',
                'Mobile-responsive design'
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {t(
                'onboarding.landing_pages.feature_print',
                'Print and PDF export for patients'
              )}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {t('onboarding.landing_pages.lifecycle_title', 'How it works:')}
          </h4>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-800">
              {t('onboarding.landing_pages.lifecycle_create', 'Create Link')}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="rounded-lg bg-pink-100 px-3 py-2 text-sm font-medium text-pink-800">
              {t('onboarding.landing_pages.lifecycle_share', 'Share via Email')}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
              {t('onboarding.landing_pages.lifecycle_view', 'Patient Views')}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
