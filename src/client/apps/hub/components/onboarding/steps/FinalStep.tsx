import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mail,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Image,
  Bot,
  Headphones,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react'
import { BrandingData, SocialLinks } from '../../../services/brandingService'
import { SOCIAL_NETWORKS } from '../icons'

interface FinalStepProps {
  branding: BrandingData
  onNavigate: (path: string) => void
}

export const FinalStep: React.FC<FinalStepProps> = ({
  branding,
  onNavigate,
}) => {
  const { t } = useTranslation('hub')

  const activeSocials = SOCIAL_NETWORKS.filter(
    ({ key }) => branding.socialLinks?.[key as keyof SocialLinks]
  )

  return (
    <>
      {/* Left Column - Next Steps */}
      <div className="flex flex-col space-y-4">
        {/* Email Configuration */}
        <div className="border-l-4 border-[#E91E63] bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#E91E63]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {t('onboarding.final.email_title', 'Email Configuration')}
              </h3>
              <p className="text-base text-gray-600 mt-1">
                {t(
                  'onboarding.final.email_description',
                  "You can configure your own SMTP server, or use LivoCare's free email service that is already configured and ready to use."
                )}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t('onboarding.final.email_patient_from', 'Your patient will receive e-mails from:')}
              </p>
              <span className="inline-flex bg-pink-50 text-[#E91E63] text-xs font-mono px-2 py-1 rounded mt-1">
                admin@livocare.ai
              </span>
              <div className="mt-2">
                <button
                  onClick={() => onNavigate('/configurations/communication')}
                  className="text-sm font-medium text-[#E91E63] hover:underline flex items-center gap-1"
                >
                  {t('onboarding.final.email_button', 'Configure Email')}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Template Marketplace */}
        <div className="border-l-4 border-[#5ED6CE] bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[#5ED6CE]/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#5ED6CE]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {t('onboarding.final.marketplace_title', 'Template Marketplace')}
              </h3>
              <p className="text-base text-gray-600 mt-1">
                {t(
                  'onboarding.final.marketplace_description',
                  'Browse curated templates by specialty and import them to your TQ with one click.'
                )}
              </p>
              <div className="mt-2">
                <button
                  onClick={() => onNavigate('/marketplace')}
                  className="text-sm font-medium text-[#5ED6CE] hover:underline flex items-center gap-1"
                >
                  {t('onboarding.final.marketplace_button', 'Browse Marketplace')}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ready */}
        <div className="border-l-4 border-green-500 bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {t('onboarding.final.ready_title', "You're All Set!")}
              </h3>
              <p className="text-base text-gray-600 mt-1">
                {t(
                  'onboarding.final.ready_description',
                  'Your Hub is ready to use. Access these settings anytime from the Configurations menu in the sidebar.'
                )}
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.final.ready_sso',
                      'Login to TQ is automatic — no extra credentials needed'
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.final.ready_support',
                      'Click the support icon in the top menu for human help'
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#5ED6CE] flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.final.ready_ai',
                      'AI 24/7 support is available inside TQ — test it out!'
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Branding Summary */}
      <div className="flex flex-col">
        <div className="bg-gray-50 rounded-xl p-6 space-y-5">
          <h3 className="font-bold text-lg text-gray-900">
            {t('onboarding.final.summary_title', 'Your Branding Summary')}
          </h3>

          {/* Logo */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              {t('onboarding.final.summary_logo', 'Logo')}
            </p>
            {branding.logoUrl ? (
              <div className="bg-white border border-gray-200 rounded-lg p-3 inline-block">
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="max-h-20 object-contain"
                />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-2 text-gray-400">
                <Image className="w-5 h-5" />
                <span className="text-sm">
                  {t('onboarding.final.summary_no_logo', 'No logo uploaded')}
                </span>
              </div>
            )}
          </div>

          {/* Colors */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              {t('onboarding.final.summary_colors', 'Colors')}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: branding.primaryColor || '#B725B7' }}
              />
              <div
                className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: branding.secondaryColor || '#E91E63' }}
              />
              <div
                className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: branding.tertiaryColor || '#5ED6CE' }}
              />
            </div>
          </div>

          {/* Company Info */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              {t('onboarding.final.summary_company', 'Company')}
            </p>
            {branding.companyName || branding.email || branding.phone || branding.address ? (
              <div className="space-y-1.5">
                {branding.companyName && (
                  <p className="font-medium text-gray-900">{branding.companyName}</p>
                )}
                {branding.email && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {branding.email}
                  </p>
                )}
                {branding.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {branding.phone}
                  </p>
                )}
                {branding.address && (
                  <p className="flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    {branding.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {t('onboarding.final.summary_no_company', 'Not configured yet')}
              </p>
            )}
          </div>

          {/* Social Links */}
          {activeSocials.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                {t('onboarding.final.summary_social', 'Social Media')}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeSocials.map(({ key, icon: Icon, label }) => {
                  const url = branding.socialLinks?.[key as keyof SocialLinks]
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-[#B725B7] hover:text-[#B725B7] transition-colors"
                      title={label}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
