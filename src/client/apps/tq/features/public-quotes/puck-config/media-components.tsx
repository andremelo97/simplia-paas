import React, { useEffect } from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, backgroundColorOptions, resolveColor, fontOptions, loadGoogleFont } from './color-options'

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
      padding: 0,
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
            boxSizing: 'border-box',
            paddingTop: `${padding}px`,
            paddingBottom: `${padding}px`,
            overflow: 'hidden',
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
      padding: 0,
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
            boxSizing: 'border-box',
            paddingTop: `${padding}px`,
            paddingBottom: `${padding}px`,
            overflow: 'hidden',
          }}
        >
          <div
            className={videoWrapperId}
            style={{
              width: '100%',
              maxWidth: maxWidth,
              boxSizing: 'border-box',
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
        label: 'Images (max 10)',
        max: 10,
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
      imagesPerSlide: {
        type: 'select' as const,
        label: 'Images Per Slide',
        options: [
          { label: '1 image', value: 1 },
          { label: '2 images side by side', value: 2 },
          { label: '3 images side by side', value: 3 },
        ],
      },
      imageGap: {
        type: 'select' as const,
        label: 'Gap Between Images',
        options: [
          { label: 'None (0px)', value: 0 },
          { label: 'Small (8px)', value: 8 },
          { label: 'Medium (16px)', value: 16 },
          { label: 'Large (24px)', value: 24 },
          { label: 'X-Large (32px)', value: 32 },
        ],
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
      imagesPerSlide: 1,
      imageGap: 8,
      transitionTime: 5,
      autoPlay: true,
      showArrows: true,
      height: 'md',
      borderRadius: 8,
      maxWidth: '100%',
      alignment: 'center',
      padding: 24,
    },
    render: ({ images, imagesPerSlide = 1, imageGap = 8, transitionTime, autoPlay, showArrows, height, borderRadius, maxWidth, alignment, padding }: any) => {
      const containerRef = React.useRef<HTMLDivElement>(null)
      const [currentIndex, setCurrentIndex] = React.useState(0)
      const [isPaused, setIsPaused] = React.useState(false)
      const [containerWidth, setContainerWidth] = React.useState(1024)

      // Convert to number to handle string values from Puck
      const configuredPerSlide = typeof imagesPerSlide === 'string' ? parseInt(imagesPerSlide) : (imagesPerSlide || 1)
      const gap = typeof imageGap === 'string' ? parseInt(imageGap) : (imageGap || 0)

      // Convert string booleans to actual booleans (Puck radio fields can return strings)
      const shouldShowArrows = showArrows === true || showArrows === 'true'
      const shouldAutoPlay = autoPlay === true || autoPlay === 'true'

      const heightMap: Record<string, string> = {
        sm: '200px',
        md: '300px',
        lg: '400px',
        xl: '500px',
      }

      // Detect container size (works in Puck preview and actual page)
      React.useEffect(() => {
        const checkContainerSize = () => {
          if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth)
          }
        }

        checkContainerSize()

        // Use ResizeObserver for container size changes
        const resizeObserver = new ResizeObserver(checkContainerSize)
        if (containerRef.current) {
          resizeObserver.observe(containerRef.current)
        }

        // Also listen to window resize as fallback
        window.addEventListener('resize', checkContainerSize)

        return () => {
          resizeObserver.disconnect()
          window.removeEventListener('resize', checkContainerSize)
        }
      }, [])

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

      // Calculate responsive images per slide based on container width
      // Mobile (< 640px): always 1 | Tablet (640-1024px): max 2 | Desktop (> 1024px): as configured
      const getResponsivePerSlide = () => {
        if (containerWidth < 640) return 1
        if (containerWidth < 1024) return Math.min(configuredPerSlide, 2)
        return configuredPerSlide
      }

      const responsivePerSlide = getResponsivePerSlide()

      // Effective images per slide (can't show more images than we have)
      const effectivePerSlide = Math.min(responsivePerSlide, validImages.length)

      // Calculate max index (how many positions we can slide to)
      const maxIndex = Math.max(0, validImages.length - effectivePerSlide)

      // Total number of slide positions (for indicators)
      const totalPositions = maxIndex + 1

      // Reset currentIndex if it exceeds maxIndex (can happen on resize)
      React.useEffect(() => {
        if (currentIndex > maxIndex) {
          setCurrentIndex(maxIndex)
        }
      }, [currentIndex, maxIndex])

      // Auto-play effect
      React.useEffect(() => {
        if (!shouldAutoPlay || isPaused || maxIndex === 0) return

        const interval = setInterval(() => {
          setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
        }, transitionTime * 1000)

        return () => clearInterval(interval)
      }, [shouldAutoPlay, isPaused, transitionTime, maxIndex])

      const goToPrev = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
      }

      const goToNext = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
      }

      const goToSlide = (index: number) => {
        setCurrentIndex(index)
      }

      // Check if navigation should be shown
      const hasMultipleSlides = maxIndex > 0

      if (validImages.length === 0) {
        return (
          <div
            ref={containerRef}
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
              Add images to the carousel (max 10)
            </div>
          </div>
        )
      }

      // Calculate the width of each image as a percentage of the visible area
      const imageWidthPercent = 100 / effectivePerSlide
      // Calculate the translate amount (one image width per step)
      const translatePercent = currentIndex * imageWidthPercent

      return (
        <div
          ref={containerRef}
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
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Images container */}
            <div
              style={{
                display: 'flex',
                height: '100%',
                transform: `translateX(-${translatePercent}%)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              {validImages.map((image: any, index: number) => (
                <div
                  key={index}
                  style={{
                    width: `${imageWidthPercent}%`,
                    height: '100%',
                    flexShrink: 0,
                    paddingLeft: effectivePerSlide > 1 && index > 0 ? `${gap / 2}px` : '0',
                    paddingRight: effectivePerSlide > 1 && index < validImages.length - 1 ? `${gap / 2}px` : '0',
                    boxSizing: 'border-box',
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `Slide ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: effectivePerSlide > 1 && gap > 0 ? '4px' : '0',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {shouldShowArrows && hasMultipleSlides && (
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

            {/* Indicators - always visible when there are multiple slides */}
            {hasMultipleSlides && (
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
                {Array.from({ length: totalPositions }).map((_, index: number) => (
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

  VideoRows: {
    fields: {
      rows: {
        type: 'array' as const,
        label: 'Video Rows',
        arrayFields: {
          layout: {
            type: 'radio' as const,
            label: 'Videos per Row',
            options: [
              { label: '1 Video', value: '1' },
              { label: '2 Videos', value: '2' },
            ],
          },
          video1Title: {
            type: 'text' as const,
            label: 'Video 1 Title',
          },
          video1Url: {
            type: 'text' as const,
            label: 'Video 1 URL (embed)',
          },
          video2Title: {
            type: 'text' as const,
            label: 'Video 2 Title',
          },
          video2Url: {
            type: 'text' as const,
            label: 'Video 2 URL (embed)',
          },
        },
        defaultItemProps: {
          layout: '2',
          video1Title: 'Video 1',
          video1Url: '',
          video2Title: 'Video 2',
          video2Url: '',
        },
      },
      // Title styling
      titleColor: {
        type: 'select' as const,
        label: 'Title Color',
        options: textColorOptions,
      },
      titleFontFamily: {
        type: 'select' as const,
        label: 'Title Font',
        options: fontOptions,
      },
      titleSize: {
        type: 'select' as const,
        label: 'Title Size',
        options: [
          { label: 'Small (14px)', value: '14' },
          { label: 'Medium (16px)', value: '16' },
          { label: 'Large (18px)', value: '18' },
          { label: 'XL (20px)', value: '20' },
          { label: '2XL (24px)', value: '24' },
        ],
      },
      // Video size options
      videoWidth: {
        type: 'select' as const,
        label: 'Video Max Width',
        options: [
          { label: 'Full Width', value: '100%' },
          { label: 'Small (320px)', value: '320px' },
          { label: 'Medium (480px)', value: '480px' },
          { label: 'Large (560px)', value: '560px' },
          { label: 'X-Large (640px)', value: '640px' },
          { label: '2X-Large (768px)', value: '768px' },
        ],
      },
      videoHeight: {
        type: 'select' as const,
        label: 'Video Height',
        options: [
          { label: 'Auto (16:9)', value: 'auto' },
          { label: 'Small (180px)', value: '180' },
          { label: 'Medium (240px)', value: '240' },
          { label: 'Large (315px)', value: '315' },
          { label: 'X-Large (400px)', value: '400' },
          { label: '2X-Large (480px)', value: '480' },
        ],
      },
      // Layout options
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: backgroundColorOptions,
      },
      rowGap: {
        type: 'select' as const,
        label: 'Gap Between Rows',
        options: [
          { label: '16px', value: 16 },
          { label: '24px', value: 24 },
          { label: '32px', value: 32 },
          { label: '40px', value: 40 },
          { label: '48px', value: 48 },
          { label: '64px', value: 64 },
        ],
      },
      videoGap: {
        type: 'select' as const,
        label: 'Gap Between Videos',
        options: [
          { label: '8px', value: 8 },
          { label: '16px', value: 16 },
          { label: '24px', value: 24 },
          { label: '32px', value: 32 },
          { label: '40px', value: 40 },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: paddingOptions,
      },
      horizontalPadding: {
        type: 'select' as const,
        label: 'Horizontal Padding',
        options: paddingOptions,
      },
      borderRadius: {
        type: 'select' as const,
        label: 'Video Border Radius',
        options: borderRadiusOptions,
      },
    },
    defaultProps: {
      rows: [
        {
          layout: '2',
          video1Title: 'Video 1',
          video1Url: '',
          video2Title: 'Video 2',
          video2Url: '',
        },
      ],
      titleColor: 'primary',
      titleFontFamily: 'inherit',
      titleSize: '16',
      videoWidth: '100%',
      videoHeight: 'auto',
      backgroundColor: 'none',
      rowGap: 32,
      videoGap: 24,
      verticalPadding: 0,
      horizontalPadding: 0,
      borderRadius: 8,
    },
    render: ({ rows, titleColor, titleFontFamily, titleSize, videoWidth, videoHeight, backgroundColor, rowGap, videoGap, verticalPadding, horizontalPadding, borderRadius }: any) => {
      useEffect(() => {
        loadGoogleFont(titleFontFamily)
      }, [titleFontFamily])

      const uniqueId = `video-rows-${Math.random().toString(36).substr(2, 9)}`
      const titleColorResolved = resolveColor(titleColor, branding)
      const bgColorResolved = resolveColor(backgroundColor, branding)
      const fontFamilyStyle = titleFontFamily !== 'inherit' ? `'${titleFontFamily}', sans-serif` : 'inherit'

      // Convert YouTube and Vimeo URLs to embed URLs
      const getEmbedUrl = (inputUrl: string) => {
        if (!inputUrl) return ''

        // YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        const youtubeMatch = inputUrl.match(youtubeRegex)
        if (youtubeMatch) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`
        }

        // Vimeo
        const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
        const vimeoMatch = inputUrl.match(vimeoRegex)
        if (vimeoMatch) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`
        }

        // Already an embed URL
        return inputUrl
      }

      return (
        <>
          <div
            className={uniqueId}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: bgColorResolved,
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              paddingLeft: `${horizontalPadding}px`,
              paddingRight: `${horizontalPadding}px`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: `${rowGap}px`,
              }}
            >
              {rows && rows.map((row: any, rowIndex: number) => {
                const isSingleVideo = row.layout === '1'

                return (
                  <div
                    key={rowIndex}
                    className={`${uniqueId}-row`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isSingleVideo ? '1fr' : '1fr 1fr',
                      gap: `${videoGap}px`,
                    }}
                  >
                    {/* Video 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      {row.video1Title && (
                        <h3
                          style={{
                            fontFamily: fontFamilyStyle,
                            fontSize: `${titleSize}px`,
                            fontWeight: '500',
                            color: titleColorResolved,
                            textAlign: 'center',
                            margin: 0,
                            textDecoration: 'underline',
                            textUnderlineOffset: '4px',
                          }}
                        >
                          {row.video1Title}
                        </h3>
                      )}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: videoWidth,
                          height: videoHeight === 'auto' ? undefined : `${videoHeight}px`,
                          aspectRatio: videoHeight === 'auto' ? '16/9' : undefined,
                          backgroundColor: '#f3f4f6',
                          borderRadius: `${borderRadius}px`,
                          overflow: 'hidden',
                        }}
                      >
                        {row.video1Url ? (
                          <iframe
                            src={getEmbedUrl(row.video1Url)}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 'none',
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={row.video1Title || 'Video'}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              minHeight: '180px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              fontSize: '14px',
                            }}
                          >
                            Add video URL
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video 2 (only if layout is 2) */}
                    {!isSingleVideo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        {row.video2Title && (
                          <h3
                            style={{
                              fontFamily: fontFamilyStyle,
                              fontSize: `${titleSize}px`,
                              fontWeight: '500',
                              color: titleColorResolved,
                              textAlign: 'center',
                              margin: 0,
                              textDecoration: 'underline',
                              textUnderlineOffset: '4px',
                            }}
                          >
                            {row.video2Title}
                          </h3>
                        )}
                        <div
                          style={{
                            width: '100%',
                            maxWidth: videoWidth,
                            height: videoHeight === 'auto' ? undefined : `${videoHeight}px`,
                            aspectRatio: videoHeight === 'auto' ? '16/9' : undefined,
                            backgroundColor: '#f3f4f6',
                            borderRadius: `${borderRadius}px`,
                            overflow: 'hidden',
                          }}
                        >
                          {row.video2Url ? (
                            <iframe
                              src={getEmbedUrl(row.video2Url)}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                              }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={row.video2Title || 'Video'}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '180px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                                fontSize: '14px',
                              }}
                            >
                              Add video URL
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .${uniqueId}-row {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </>
      )
    },
  },
})

