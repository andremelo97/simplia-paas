import React, { useState, useEffect } from 'react'
import { Upload, Palette, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Card, Label, Alert, AlertDescription } from '@client/common/ui'
import { brandingService, BrandingData } from '../../services/brandingService'
import { ImageUploadModal } from '../../components/configurations/ImageUploadModal'
import { VideoUploadModal } from '../../components/configurations/VideoUploadModal'

export const BrandingConfiguration: React.FC = () => {
  const { t } = useTranslation('hub')
  // Initialize with empty values so form always renders
  const [branding, setBranding] = useState<BrandingData>({
    tenantId: 0,
    primaryColor: '',
    secondaryColor: '',
    tertiaryColor: '',
    logoUrl: null,
    backgroundVideoUrl: null,
    companyName: null
  })
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [videoUploadModalOpen, setVideoUploadModalOpen] = useState(false)

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
      console.error('Failed to load branding:', error)
      // Keep empty values if loading fails
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!branding) return

    try {
      await brandingService.updateBranding(branding)
      // Feedback handled by HTTP interceptor
    } catch (error) {
      console.error('Failed to update branding:', error)
    }
  }

  const handleReset = async () => {
    if (!confirm(t('branding.reset_confirm'))) return

    try {
      await brandingService.resetBranding()
      await loadBranding()
    } catch (error) {
      console.error('Failed to reset branding:', error)
    }
  }

  const handleOpenUploadModal = () => {
    setUploadModalOpen(true)
  }

  const handleUploadComplete = (imageUrl: string) => {
    // Update local state with new logo URL
    setBranding(prev => ({ ...prev, logoUrl: imageUrl }))
  }

  const handleVideoUploadComplete = (videoUrl: string) => {
    // Update local state with new video URL
    setBranding(prev => ({ ...prev, backgroundVideoUrl: videoUrl }))
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Palette className="h-6 w-6 text-[#B725B7]" />
          <h1 className="text-2xl font-bold text-gray-900">{t('branding.title')}</h1>
        </div>
        <p className="text-gray-600">
          {t('branding.subtitle')}
        </p>
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

      {/* Company Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('branding.company_info')}</h2>
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
              onClick={handleOpenUploadModal}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('branding.upload_logo')}
            </Button>
            <p className="text-xs text-gray-500">{t('branding.image_formats')}</p>
          </div>
        </div>
      </Card>

      {/* Background Video */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-[#B725B7]" />
          <h2 className="text-lg font-semibold text-gray-900">{t('branding.background_video')}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {t('branding.background_video_description')}
        </p>
        <div className="space-y-3">
          {branding.backgroundVideoUrl && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <video
                src={branding.backgroundVideoUrl}
                className="w-full max-h-48 rounded"
                controls
                muted
              />
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setVideoUploadModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            {branding.backgroundVideoUrl ? t('branding.replace_video') : t('branding.upload_video')}
          </Button>
          <p className="text-xs text-gray-500">
            {t('branding.video_formats')}
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave}>{t('branding.save_changes')}</Button>
        <Button variant="secondary" onClick={handleReset}>{t('branding.reset_to_defaults')}</Button>
      </div>

      {/* Upload Modals */}
      <ImageUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
      <VideoUploadModal
        open={videoUploadModalOpen}
        onClose={() => setVideoUploadModalOpen(false)}
        onUploadComplete={handleVideoUploadComplete}
      />
    </div>
  )
}
