import React, { useState, useEffect } from 'react'
import { Upload, Palette, Video } from 'lucide-react'
import { Button, Input, Card, Label } from '@client/common/ui'
import { brandingService, BrandingData } from '../../services/brandingService'
import { ImageUploadModal } from '../../components/configurations/ImageUploadModal'
import { VideoUploadModal } from '../../components/configurations/VideoUploadModal'

export const BrandingConfiguration: React.FC = () => {
  // Initialize with empty values so form always renders
  const [branding, setBranding] = useState<BrandingData>({
    tenantId: 0,
    primaryColor: '',
    secondaryColor: '',
    tertiaryColor: '',
    logoUrl: null,
    faviconUrl: null,
    backgroundVideoUrl: null,
    companyName: null
  })
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadType, setUploadType] = useState<'logo' | 'favicon'>('logo')
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
    if (!confirm('Are you sure you want to reset branding to defaults?')) return

    try {
      await brandingService.resetBranding()
      await loadBranding()
    } catch (error) {
      console.error('Failed to reset branding:', error)
    }
  }

  const handleOpenUploadModal = (type: 'logo' | 'favicon') => {
    setUploadType(type)
    setUploadModalOpen(true)
  }

  const handleUploadComplete = (imageUrl: string) => {
    // Update local state with new image URL
    if (uploadType === 'logo') {
      setBranding(prev => ({ ...prev, logoUrl: imageUrl }))
    } else {
      setBranding(prev => ({ ...prev, faviconUrl: imageUrl }))
    }
  }

  const handleVideoUploadComplete = (videoUrl: string) => {
    // Update local state with new video URL
    setBranding(prev => ({ ...prev, backgroundVideoUrl: videoUrl }))
  }

  return (
    <div className="p-8 space-y-6">
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          Loading branding configuration...
        </div>
      )}
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Palette className="h-6 w-6 text-[#B725B7]" />
          <h1 className="text-2xl font-bold text-gray-900">Branding Configuration</h1>
        </div>
        <p className="text-gray-600">
          Customize your organization's visual identity and branding
        </p>
      </div>

      {/* Colors */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
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
            <Label htmlFor="secondaryColor">Secondary Color</Label>
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
            <Label htmlFor="tertiaryColor">Tertiary Color</Label>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={branding.companyName || ''}
            onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
            placeholder="Your Company Name"
            className="mt-2"
          />
        </div>
      </Card>

      {/* Logo & Favicon */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <Label>Company Logo</Label>
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
                className="w-full"
                onClick={() => handleOpenUploadModal('logo')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <p className="text-xs text-gray-500">PNG, JPEG, SVG, or ICO (max 5MB)</p>
            </div>
          </div>

          {/* Favicon */}
          <div>
            <Label>Favicon</Label>
            <div className="mt-2 space-y-3">
              {branding.faviconUrl && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center h-32">
                  <img
                    src={branding.faviconUrl}
                    alt="Favicon preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOpenUploadModal('favicon')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Favicon
              </Button>
              <p className="text-xs text-gray-500">PNG, JPEG, SVG, or ICO (max 5MB)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Background Video */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-[#B725B7]" />
          <h2 className="text-lg font-semibold text-gray-900">Background Video (Optional)</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upload a video to use as background in Hero sections. The video will auto-play on loop with adjustable opacity.
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
            {branding.backgroundVideoUrl ? 'Replace Video' : 'Upload Video'}
          </Button>
          <p className="text-xs text-gray-500">
            MP4 format only • Max size: 20MB • Recommended: landscape format, optimized for web
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        <Button variant="secondary" onClick={handleReset}>Reset to Defaults</Button>
      </div>

      {/* Upload Modals */}
      <ImageUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
        type={uploadType}
      />
      <VideoUploadModal
        open={videoUploadModalOpen}
        onClose={() => setVideoUploadModalOpen(false)}
        onUploadComplete={handleVideoUploadComplete}
      />
    </div>
  )
}
