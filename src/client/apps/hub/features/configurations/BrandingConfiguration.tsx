import React, { useState, useEffect } from 'react'
import { Upload, Palette, Phone, MapPin, Globe, Facebook, Instagram, Linkedin, Mail } from 'lucide-react'

// Custom brand icons (lucide doesn't have brand icons)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
)
import { useTranslation } from 'react-i18next'
import { Button, Input, Card, Label, Alert, AlertDescription, Textarea } from '@client/common/ui'
import { brandingService, BrandingData, SocialLinks } from '../../services/brandingService'
import { ImageUploadModal } from '../../components/configurations/ImageUploadModal'
import { MediaLibrary } from '../../components/configurations/MediaLibrary'

// Social network configuration with icons
const SOCIAL_NETWORKS = [
  { key: 'facebook', icon: Facebook, label: 'Facebook', placeholder: 'https://facebook.com/sua-empresa' },
  { key: 'instagram', icon: Instagram, label: 'Instagram', placeholder: 'https://instagram.com/sua-empresa' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/company/sua-empresa' },
  { key: 'twitter', icon: XIcon, label: 'X', placeholder: 'https://x.com/sua-empresa' },
  { key: 'youtube', icon: YouTubeIcon, label: 'YouTube', placeholder: 'https://youtube.com/@sua-empresa' },
  { key: 'pinterest', icon: PinterestIcon, label: 'Pinterest', placeholder: 'https://pinterest.com/sua-empresa' },
  { key: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp', placeholder: 'https://wa.me/5511999999999' },
  { key: 'website', icon: Globe, label: 'Website', placeholder: 'https://www.sua-empresa.com.br' },
] as const

export const BrandingConfiguration: React.FC = () => {
  const { t } = useTranslation('hub')
  const [branding, setBranding] = useState<BrandingData>({
    tenantId: 0,
    primaryColor: '',
    secondaryColor: '',
    tertiaryColor: '',
    logoUrl: null,
    companyName: null,
    email: null,
    phone: null,
    address: null,
    socialLinks: {}
  })

  // Track which social network input is expanded
  const [expandedSocial, setExpandedSocial] = useState<string | null>(null)

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setBranding(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value || undefined
      }
    }))
  }

  const toggleSocialExpand = (key: string) => {
    setExpandedSocial(prev => prev === key ? null : key)
  }

  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const data = await brandingService.getBranding()
      if (data) {
        setBranding(data)
      }
    } catch (error) {
      // Keep empty values if loading fails
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!branding) return

    try {
      await brandingService.updateBranding(branding)
    } catch (error) {
      // Error updating branding
    }
  }

  const handleReset = async () => {
    if (!confirm(t('branding.reset_confirm'))) return

    try {
      await brandingService.resetBranding()
      await loadBranding()
    } catch (error) {
      // Error resetting branding
    }
  }

  const handleUploadComplete = (imageUrl: string) => {
    setBranding(prev => ({ ...prev, logoUrl: imageUrl }))
  }

  if (loading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>{t('branding.loading')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white -mx-8 px-8 -mt-8 pt-8 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Palette className="h-6 w-6 text-[#B725B7]" />
            <h1 className="text-2xl font-bold text-gray-900">{t('branding.title')}</h1>
          </div>
          <p className="text-gray-600">
            {t('branding.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSave}>{t('branding.save_changes')}</Button>
          <Button variant="secondary" onClick={handleReset}>{t('branding.reset_to_defaults')}</Button>
        </div>
      </div>

      {/* Colors */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('branding.brand_colors')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="primaryColor">{t('branding.primary_color')}</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="color"
                id="primaryColor"
                value={branding.primaryColor || '#000000'}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={branding.primaryColor || ''}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                placeholder="#B725B7"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondaryColor">{t('branding.secondary_color')}</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="color"
                id="secondaryColor"
                value={branding.secondaryColor || '#000000'}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={branding.secondaryColor || ''}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                placeholder="#E91E63"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tertiaryColor">{t('branding.tertiary_color')}</Label>
            <div className="flex gap-2 mt-2">
              <input
                type="color"
                id="tertiaryColor"
                value={branding.tertiaryColor || '#000000'}
                onChange={(e) => setBranding({ ...branding, tertiaryColor: e.target.value })}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={branding.tertiaryColor || ''}
                onChange={(e) => setBranding({ ...branding, tertiaryColor: e.target.value })}
                placeholder="#5ED6CE"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Company Info + Contact - Side by Side */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('branding.company_info')}</h2>
        <p className="text-sm text-gray-600 mb-4">{t('branding.contact_info_description')}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Company Name, Email & Address */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">{t('branding.company_name')}</Label>
              <Input
                id="companyName"
                value={branding.companyName || ''}
                onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                placeholder={t('branding.company_name_placeholder')}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                {t('branding.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={branding.email || ''}
                onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                placeholder={t('branding.email_placeholder')}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                {t('branding.address')}
              </Label>
              <Textarea
                id="address"
                value={branding.address || ''}
                onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                placeholder={t('branding.address_placeholder')}
                rows={2}
                className="mt-2"
              />
            </div>
          </div>

          {/* Right Column - Phone & Social Links */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                {t('branding.phone')}
              </Label>
              <Input
                id="phone"
                value={branding.phone || ''}
                onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                placeholder="+55 11 99999-9999"
                className="mt-2"
              />
            </div>

            {/* Social Links with Icons */}
            <div>
              <Label className="mb-2 block">{t('branding.social_links')}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
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
                  {SOCIAL_NETWORKS.filter(n => n.key === expandedSocial).map(({ key, icon: Icon, label, placeholder }) => (
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
        </div>
      </Card>

      {/* Logo */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('branding.brand_assets')}</h2>
        <div>
          <Label>{t('branding.company_logo')}</Label>
          <div className="mt-2 space-y-3">
            {branding.logoUrl && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center h-32">
                <img
                  src={branding.logoUrl}
                  alt="Logo preview"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
            )}
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('branding.upload_logo')}
            </Button>
            <p className="text-xs text-gray-500">{t('branding.image_formats')}</p>
          </div>
        </div>
      </Card>

      {/* Media Library */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('media_library.title')}</h2>
        <MediaLibrary />
      </Card>

      {/* Upload Modals */}
      <ImageUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}
