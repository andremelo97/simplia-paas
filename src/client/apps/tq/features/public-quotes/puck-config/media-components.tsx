import React from 'react'
import { BrandingData } from '../../../services/branding'

const aspectRatioOptions = [
  { label: '16:9 (Widescreen)', value: '16/9' },
  { label: '4:3 (Standard)', value: '4/3' },
  { label: '1:1 (Square)', value: '1/1' },
  { label: '21:9 (Ultrawide)', value: '21/9' },
  { label: '9:16 (Vertical)', value: '9/16' },
  { label: 'Auto (Natural)', value: 'auto' },
]

const objectFitOptions = [
  { label: 'Cover (Fill)', value: 'cover' },
  { label: 'Contain (Fit)', value: 'contain' },
  { label: 'Fill (Stretch)', value: 'fill' },
  { label: 'None (Original)', value: 'none' },
]

const alignmentOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]

const borderRadiusOptions = [
  { label: 'None', value: 0 },
  { label: 'Small (4px)', value: 4 },
  { label: 'Medium (8px)', value: 8 },
  { label: 'Large (16px)', value: 16 },
  { label: 'X-Large (24px)', value: 24 },
  { label: 'Full (9999px)', value: 9999 },
]

const maxWidthOptions = [
  { label: 'Full Width', value: '100%' },
  { label: 'Extra Small (320px)', value: '320px' },
  { label: 'Small (480px)', value: '480px' },
  { label: 'Medium (640px)', value: '640px' },
  { label: 'Large (768px)', value: '768px' },
  { label: 'X-Large (1024px)', value: '1024px' },
  { label: '2X-Large (1280px)', value: '1280px' },
]

const paddingOptions = [
  { label: 'None (0px)', value: 0 },
  { label: 'X-Small (8px)', value: 8 },
  { label: 'Small (16px)', value: 16 },
  { label: 'Medium (24px)', value: 24 },
  { label: 'Large (32px)', value: 32 },
  { label: 'X-Large (48px)', value: 48 },
  { label: '2X-Large (64px)', value: 64 },
]

export const createMediaComponents = (branding: BrandingData) => ({
  Image: {
    fields: {
      url: {
        type: 'text' as const,
        label: 'Image URL',
      },
      alt: {
        type: 'text' as const,
        label: 'Alt Text (for accessibility)',
      },
      aspectRatio: {
        type: 'select' as const,
        label: 'Aspect Ratio',
        options: aspectRatioOptions,
      },
      objectFit: {
        type: 'select' as const,
        label: 'Object Fit',
        options: objectFitOptions,
      },
      borderRadius: {
        type: 'select' as const,
        label: 'Border Radius',
        options: borderRadiusOptions,
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: maxWidthOptions,
      },
      alignment: {
        type: 'select' as const,
        label: 'Alignment',
        options: alignmentOptions,
      },
      padding: {
        type: 'select' as const,
        label: 'Padding (Top & Bottom)',
        options: paddingOptions,
      },
      linkUrl: {
        type: 'text' as const,
        label: 'Link URL (optional)',
      },
      openInNewTab: {
        type: 'radio' as const,
        label: 'Open Link in New Tab',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
    },
    defaultProps: {
      url: '',
      alt: 'Image',
      aspectRatio: '16/9',
      objectFit: 'cover',
      borderRadius: 8,
      maxWidth: '100%',
      alignment: 'center',
      padding: 24,
      linkUrl: '',
      openInNewTab: true,
    },
    render: ({ url, alt, aspectRatio, objectFit, borderRadius, maxWidth, alignment, padding, linkUrl, openInNewTab }: any) => {
      const containerId = `image-container-${Math.random().toString(36).substr(2, 9)}`
      const imageWrapperId = `image-wrapper-${Math.random().toString(36).substr(2, 9)}`
      
      const getAlignmentStyle = () => {
        switch (alignment) {
          case 'left':
            return { marginLeft: 0, marginRight: 'auto' }
          case 'right':
            return { marginLeft: 'auto', marginRight: 0 }
          case 'center':
          default:
            return { marginLeft: 'auto', marginRight: 'auto' }
        }
      }

      const imageContent = (
        <div
          className={imageWrapperId}
          style={{
            width: '100%',
            maxWidth: maxWidth,
            ...getAlignmentStyle(),
            borderRadius: `${borderRadius}px`,
            overflow: 'hidden',
            backgroundColor: '#f3f4f6',
            ...(aspectRatio !== 'auto' && { aspectRatio: aspectRatio }),
          }}
        >
          {url ? (
            <img
              src={url}
              alt={alt || 'Image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: aspectRatio !== 'auto' ? '100%' : '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              No image URL provided
            </div>
          )}
        </div>
      )

      const content = linkUrl ? (
        <a
          href={linkUrl}
          target={openInNewTab ? '_blank' : '_self'}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          style={{ display: 'block', textDecoration: 'none' }}
        >
          {imageContent}
        </a>
      ) : (
        imageContent
      )

      return (
        <div
          className={containerId}
          style={{
            width: '100%',
            paddingTop: `${padding}px`,
            paddingBottom: `${padding}px`,
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {content}
        </div>
      )
    },
  },

  Video: {
    fields: {
      url: {
        type: 'text' as const,
        label: 'Video URL (YouTube, Vimeo, or embed URL)',
      },
      aspectRatio: {
        type: 'select' as const,
        label: 'Aspect Ratio',
        options: aspectRatioOptions.filter(opt => opt.value !== 'auto'), // Remove auto for videos
      },
      borderRadius: {
        type: 'select' as const,
        label: 'Border Radius',
        options: borderRadiusOptions,
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: maxWidthOptions,
      },
      alignment: {
        type: 'select' as const,
        label: 'Alignment',
        options: alignmentOptions,
      },
      padding: {
        type: 'select' as const,
        label: 'Padding (Top & Bottom)',
        options: paddingOptions,
      },
      autoplay: {
        type: 'radio' as const,
        label: 'Autoplay',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      loop: {
        type: 'radio' as const,
        label: 'Loop',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      muted: {
        type: 'radio' as const,
        label: 'Muted',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      controls: {
        type: 'radio' as const,
        label: 'Show Controls',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
    },
    defaultProps: {
      url: '',
      aspectRatio: '16/9',
      borderRadius: 8,
      maxWidth: '100%',
      alignment: 'center',
      padding: 24,
      autoplay: false,
      loop: false,
      muted: false,
      controls: true,
    },
    render: ({ url, aspectRatio, borderRadius, maxWidth, alignment, padding, autoplay, loop, muted, controls }: any) => {
      const containerId = `video-container-${Math.random().toString(36).substr(2, 9)}`
      const videoWrapperId = `video-wrapper-${Math.random().toString(36).substr(2, 9)}`
      
      const getAlignmentStyle = () => {
        switch (alignment) {
          case 'left':
            return { marginLeft: 0, marginRight: 'auto' }
          case 'right':
            return { marginLeft: 'auto', marginRight: 0 }
          case 'center':
          default:
            return { marginLeft: 'auto', marginRight: 'auto' }
        }
      }

      // Convert YouTube and Vimeo URLs to embed URLs
      const getEmbedUrl = (inputUrl: string) => {
        if (!inputUrl) return ''

        // YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        const youtubeMatch = inputUrl.match(youtubeRegex)
        if (youtubeMatch) {
          const videoId = youtubeMatch[1]
          let embedUrl = `https://www.youtube.com/embed/${videoId}?`
          if (autoplay) embedUrl += 'autoplay=1&'
          if (loop) embedUrl += `loop=1&playlist=${videoId}&`
          if (muted) embedUrl += 'mute=1&'
          if (!controls) embedUrl += 'controls=0&'
          return embedUrl
        }

        // Vimeo
        const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
        const vimeoMatch = inputUrl.match(vimeoRegex)
        if (vimeoMatch) {
          const videoId = vimeoMatch[1]
          let embedUrl = `https://player.vimeo.com/video/${videoId}?`
          if (autoplay) embedUrl += 'autoplay=1&'
          if (loop) embedUrl += 'loop=1&'
          if (muted) embedUrl += 'muted=1&'
          return embedUrl
        }

        // Already an embed URL or direct video URL
        return inputUrl
      }

      const embedUrl = getEmbedUrl(url)

      return (
        <div
          className={containerId}
          style={{
            width: '100%',
            paddingTop: `${padding}px`,
            paddingBottom: `${padding}px`,
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div
            className={videoWrapperId}
            style={{
              width: '100%',
              maxWidth: maxWidth,
              ...getAlignmentStyle(),
              aspectRatio: aspectRatio,
              borderRadius: `${borderRadius}px`,
              overflow: 'hidden',
              backgroundColor: '#000000',
            }}
          >
            {embedUrl ? (
              <iframe
                src={embedUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Player"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '14px',
                  backgroundColor: '#1f2937',
                }}
              >
                No video URL provided
              </div>
            )}
          </div>
        </div>
      )
    },
  },
})

