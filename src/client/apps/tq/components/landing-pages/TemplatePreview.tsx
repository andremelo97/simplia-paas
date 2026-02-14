import React from 'react'
import { Render } from '@measured/puck'
import { createConfig } from '../../features/landing-pages/puck-config'
import { BrandingData } from '../../services/branding'

interface TemplatePreviewProps {
  content: any
  branding: BrandingData
  maxComponents?: number
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  content,
  branding,
  maxComponents = 2,
}) => {
  if (!content || !content.content || content.content.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <p className="text-sm text-gray-500">No layout designed yet</p>
      </div>
    )
  }

  // Create Puck config with branding
  const config = createConfig(branding)

  // Limit content to first N components
  const limitedContent = {
    ...content,
    content: content.content.slice(0, maxComponents),
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-white">
      <div className="scale-[0.5] origin-top-left" style={{ width: '200%', height: '200%' }}>
        <Render config={config} data={limitedContent} />
      </div>
    </div>
  )
}
