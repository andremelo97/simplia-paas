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

  ImageCarousel: {
    fields: {
      images: {
        type: 'array' as const,
        label: 'Images (max 6)',
        max: 6,
        arrayFields: {
          url: {
            type: 'text' as const,
            label: 'Image URL',
          },
          alt: {
            type: 'text' as const,
            label: 'Alt Text',
          },
        },
        defaultItemProps: {
          url: '',
          alt: 'Image',
        },
      },
      transitionTime: {
        type: 'select' as const,
        label: 'Transition Time (seconds)',
        options: [
          { label: '3 seconds', value: 3 },
          { label: '5 seconds', value: 5 },
          { label: '7 seconds', value: 7 },
          { label: '10 seconds', value: 10 },
          { label: '15 seconds', value: 15 },
        ],
      },
      autoPlay: {
        type: 'radio' as const,
        label: 'Auto Play',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      showIndicators: {
        type: 'radio' as const,
        label: 'Show Indicators',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      showArrows: {
        type: 'radio' as const,
        label: 'Show Arrows',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      height: {
        type: 'select' as const,
        label: 'Height',
        options: [
          { label: 'Small (200px)', value: 'sm' },
          { label: 'Medium (300px)', value: 'md' },
          { label: 'Large (400px)', value: 'lg' },
          { label: 'X-Large (500px)', value: 'xl' },
        ],
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
    },
    defaultProps: {
      images: [],
      transitionTime: 5,
      autoPlay: true,
      showIndicators: true,
      showArrows: true,
      height: 'md',
      borderRadius: 8,
      maxWidth: '100%',
      alignment: 'center',
      padding: 24,
    },
    render: ({ images, transitionTime, autoPlay, showIndicators, showArrows, height, borderRadius, maxWidth, alignment, padding }: any) => {
      const [currentIndex, setCurrentIndex] = React.useState(0)
      const [isPaused, setIsPaused] = React.useState(false)

      const heightMap: Record<string, string> = {
        sm: '200px',
        md: '300px',
        lg: '400px',
        xl: '500px',
      }

      const getAlignmentStyle = (): React.CSSProperties => {
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

      const validImages = Array.isArray(images) ? images.filter((img: any) => img && img.url) : []

      // Auto-play effect
      React.useEffect(() => {
        if (!autoPlay || isPaused || validImages.length <= 1) return

        const interval = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % validImages.length)
        }, transitionTime * 1000)

        return () => clearInterval(interval)
      }, [autoPlay, isPaused, transitionTime, validImages.length])

      const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
      }

      const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length)
      }

      const goToSlide = (index: number) => {
        setCurrentIndex(index)
      }

      if (validImages.length === 0) {
        return (
          <div
            style={{
              width: '100%',
              paddingTop: `${padding}px`,
              paddingBottom: `${padding}px`,
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: maxWidth,
                ...getAlignmentStyle(),
                height: heightMap[height] || '300px',
                borderRadius: `${borderRadius}px`,
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '14px',
              }}
            >
              Add images to the carousel (max 6)
            </div>
          </div>
        )
      }

      return (
        <div
          style={{
            width: '100%',
            paddingTop: `${padding}px`,
            paddingBottom: `${padding}px`,
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: maxWidth,
              ...getAlignmentStyle(),
              position: 'relative',
              height: heightMap[height] || '300px',
              borderRadius: `${borderRadius}px`,
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Images container */}
            <div
              style={{
                display: 'flex',
                width: `${validImages.length * 100}%`,
                height: '100%',
                transform: `translateX(-${currentIndex * (100 / validImages.length)}%)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              {validImages.map((image: any, index: number) => (
                <div
                  key={index}
                  style={{
                    width: `${100 / validImages.length}%`,
                    height: '100%',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `Slide ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {showArrows && validImages.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    border: 'none',
                    padding: 0,
                  }}
                  aria-label="Previous slide"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    border: 'none',
                    padding: 0,
                  }}
                  aria-label="Next slide"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            {/* Indicators */}
            {showIndicators && validImages.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10,
                }}
              >
                {validImages.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: index === currentIndex ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease',
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
})

