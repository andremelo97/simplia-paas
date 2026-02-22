import React from 'react'
import { useTranslation } from 'react-i18next'
import { Layout, Link2, Palette, CheckCircle2, ArrowRight, Headphones } from 'lucide-react'

interface LandingPagesStepProps {
  onNavigate: (path: string) => void
}

export const LandingPagesStep: React.FC<LandingPagesStepProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation('tq')

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

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t(
            'onboarding.landing_pages.description',
            'Create beautiful, branded pages to share documents with your patients. They can view quotes and prevention plans without needing to log in.'
          )}
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
          <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-gray-700" />
            {t('onboarding.landing_pages.links_title', 'Links')}
          </h4>
          <p className="text-sm text-gray-600">
            {t(
              'onboarding.landing_pages.links_desc',
              'Generate unique public URLs for each document. Manage active links, set password protection, and configure expiration dates.'
            )}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-700" />
            {t('onboarding.landing_pages.templates_title', 'Page Templates')}
          </h4>
          <p className="text-sm text-gray-600">
            {t(
              'onboarding.landing_pages.templates_desc',
              'Design the visual layout of your landing pages using a drag-and-drop builder. Add headers, footers, tables, buttons, and more.'
            )}
          </p>
        </div>

        <div className="bg-[#5ED6CE]/10 border border-[#5ED6CE]/30 rounded-lg p-4 mt-5">
          <div className="flex items-start gap-3">
            <Headphones className="w-5 h-5 text-[#5ED6CE] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              {t(
                'onboarding.landing_pages.support_tip',
                'Need help? Our support team can help you create or customize your landing page templates.'
              )}
            </p>
          </div>
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
                'Shareable links sent via email and WhatsApp'
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
              {t('onboarding.landing_pages.lifecycle_share', 'Share')}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
              {t('onboarding.landing_pages.lifecycle_view', 'Patient Views')}
            </span>
          </div>
        </div>

        {/* Tutorial video */}
        <div className="aspect-video rounded-lg overflow-hidden bg-black mt-6">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${i18n.language === 'pt-BR' ? 'q1hwfsd6OzY' : 'lCxoGorF-8w'}?rel=0`}
            title={t('onboarding.landing_pages.video_placeholder', 'See how it works')}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Navigate button */}
        <button
          onClick={() => onNavigate('/landing-pages/templates')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#B725B7] text-[#B725B7] rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium mt-4"
        >
          <Layout className="w-4 h-4" />
          {t('onboarding.landing_pages.go_to', 'Go to Landing Pages')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  )
}
