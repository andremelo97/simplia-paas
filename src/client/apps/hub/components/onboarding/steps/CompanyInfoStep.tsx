import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Mail, Phone, MapPin } from 'lucide-react'
import { Input, Textarea } from '@client/common/ui'
import { BrandingData, SocialLinks } from '../../../services/brandingService'
import { SOCIAL_NETWORKS } from '../icons'

interface CompanyInfoStepProps {
  branding: BrandingData
  setBranding: React.Dispatch<React.SetStateAction<BrandingData>>
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({ branding, setBranding }) => {
  const { t } = useTranslation('hub')
  const [expandedSocial, setExpandedSocial] = useState<string | null>(null)

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setBranding(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value || undefined }
    }))
  }

  const toggleSocialExpand = (key: string) => {
    setExpandedSocial(prev => prev === key ? null : key)
  }

  return (
    <>
      {/* Left Column - Explanation */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#B725B7] to-[#E91E63] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('onboarding.company_info.title', 'Company Information')}
          </h2>
        </div>

        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          {t('onboarding.company_info.description', 'This information is displayed in email footers and on documents sent to your clients.')}
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg aspect-video flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">
            {t('onboarding.company_info.video_placeholder', 'Tutorial video coming soon')}
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {t('onboarding.company_info.right_title', 'Fill in your details')}
        </h3>

        {/* Company Name */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">
            {t('onboarding.company_info.company_name', 'Company Name')}
          </label>
          <Input
            value={branding.companyName || ''}
            onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
            placeholder={t('onboarding.company_info.company_name_placeholder', 'Your company name')}
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-1">
            <Mail className="h-4 w-4 text-gray-500" />
            {t('onboarding.company_info.email', 'Contact Email')}
          </label>
          <Input
            type="email"
            value={branding.email || ''}
            onChange={(e) => setBranding(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t('onboarding.company_info.email_placeholder', 'contact@company.com')}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-1">
            <Phone className="h-4 w-4 text-gray-500" />
            {t('onboarding.company_info.phone', 'Phone')}
          </label>
          <Input
            value={branding.phone || ''}
            onChange={(e) => setBranding(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+55 11 99999-9999"
          />
        </div>

        {/* Address */}
        <div>
          <label className="flex items-center gap-2 text-base font-medium text-gray-700 mb-1">
            <MapPin className="h-4 w-4 text-gray-500" />
            {t('onboarding.company_info.address', 'Address')}
          </label>
          <Textarea
            value={branding.address || ''}
            onChange={(e) => setBranding(prev => ({ ...prev, address: e.target.value }))}
            placeholder={t('onboarding.company_info.address_placeholder', 'Street, number, city, state')}
            rows={2}
          />
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1">
            {t('onboarding.company_info.social_links', 'Social Media')}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {t('onboarding.company_info.social_links_helper', 'Click an icon to add a link')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_NETWORKS.map(({ key, icon: Icon, label }) => {
              const hasValue = !!branding.socialLinks?.[key as keyof SocialLinks]
              const isExpanded = expandedSocial === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSocialExpand(key)}
                  className={`p-2 rounded-lg border transition-all ${
                    hasValue
                      ? 'bg-[#B725B7] text-white border-[#B725B7]'
                      : isExpanded
                        ? 'bg-gray-100 border-[#B725B7] text-[#B725B7]'
                        : 'bg-white border-gray-300 text-gray-500 hover:border-[#B725B7] hover:text-[#B725B7]'
                  }`}
                  title={label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              )
            })}
          </div>

          {/* Expanded Input for Selected Social Network */}
          {expandedSocial && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {SOCIAL_NETWORKS.filter(n => n.key === expandedSocial).map(({ key, icon: Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[#B725B7] flex-shrink-0" />
                  <Input
                    value={branding.socialLinks?.[key as keyof SocialLinks] || ''}
                    onChange={(e) => updateSocialLink(key as keyof SocialLinks, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1"
                    autoFocus
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
