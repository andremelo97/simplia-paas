import React, { useEffect } from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor, fontOptions, loadGoogleFont, maxWidthOptions } from './color-options'

const verticalPaddingOptions = [
  { label: '0px', value: 0 },
  { label: '8px', value: 8 },
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '32px', value: 32 },
  { label: '40px', value: 40 },
  { label: '48px', value: 48 },
  { label: '56px', value: 56 },
  { label: '64px', value: 64 },
  { label: '72px', value: 72 },
  { label: '80px', value: 80 },
  { label: '88px', value: 88 },
  { label: '96px', value: 96 },
  { label: '104px', value: 104 },
  { label: '112px', value: 112 },
  { label: '120px', value: 120 },
  { label: '128px', value: 128 },
  { label: '136px', value: 136 },
  { label: '144px', value: 144 },
  { label: '152px', value: 152 },
  { label: '160px', value: 160 },
]

export const createTypographyComponents = (branding: BrandingData) => ({
  Text: {
    fields: {
      text: {
        type: 'textarea' as const,
        label: 'text',
      },
      fontFamily: {
        type: 'select' as const,
        label: 'Font',
        options: fontOptions,
      },
      size: {
        type: 'text' as const,
        label: 'Font Size (px)',
        placeholder: '16',
      },
      align: {
        type: 'radio' as const,
        label: 'align',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      color: {
        type: 'select' as const,
        label: 'Text Color',
        options: textColorOptions,
      },
      // Link options
      linkUrl: {
        type: 'text' as const,
        label: 'Link URL (optional)',
      },
      openInNewTab: {
        type: 'radio' as const,
        label: 'Open in New Tab',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      showUnderline: {
        type: 'radio' as const,
        label: 'Show Underline',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: maxWidthOptions,
      },
      horizontalPadding: {
        type: 'select' as const,
        label: 'Horizontal Padding',
        options: verticalPaddingOptions,
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
    },
    resolveFields: (data: any, { fields }: any) => {
      const resolvedFields = { ...fields }

      // Only show link options when linkUrl is provided
      if (!data.props.linkUrl) {
        delete resolvedFields.openInNewTab
        delete resolvedFields.showUnderline
      }

      return resolvedFields
    },
    defaultProps: {
      text: 'Text',
      fontFamily: 'inherit',
      size: '',
      align: 'left',
      color: 'default',
      linkUrl: '',
      openInNewTab: true,
      showUnderline: true,
      maxWidth: '100%',
      horizontalPadding: 16,
      verticalPadding: 0,
    },
    render: ({ text, fontFamily, size, align, color, linkUrl, openInNewTab, showUnderline, maxWidth, horizontalPadding, verticalPadding }: any) => {
      useEffect(() => {
        loadGoogleFont(fontFamily)
      }, [fontFamily])
      const alignStyles = {
        left: 'left' as const,
        center: 'center' as const,
        right: 'right' as const,
      }

      const textColor = resolveColor(color, branding)
      const uniqueId = `text-${Math.random().toString(36).substr(2, 9)}`
      const fontSize = typeof size === 'number' ? size : parseInt(size) || 16

      const styles: any = {
        fontFamily: fontFamily !== 'inherit' ? `'${fontFamily}', sans-serif` : 'inherit',
        fontSize: `${fontSize}px`,
        textAlign: alignStyles[align as keyof typeof alignStyles],
        wordBreak: 'break-word',
        paddingLeft: `${horizontalPadding}px`,
        paddingRight: `${horizontalPadding}px`,
        paddingTop: `${verticalPadding}px`,
        paddingBottom: `${verticalPadding}px`,
        color: textColor,
      }

      if (maxWidth && maxWidth !== '100%') {
        styles.maxWidth = maxWidth
        // Center the element when text is centered and maxWidth is set
        if (align === 'center') {
          styles.marginLeft = 'auto'
          styles.marginRight = 'auto'
        }
      }

      const textContent = linkUrl ? (
        <a
          href={linkUrl}
          target={openInNewTab ? '_blank' : '_self'}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          style={{
            color: 'inherit',
            textDecoration: showUnderline ? 'underline' : 'none',
            textUnderlineOffset: '4px',
          }}
        >
          {text}
        </a>
      ) : (
        text
      )

      return (
        <>
          <p className={uniqueId} style={styles}>
            {textContent}
          </p>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                padding-left: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
                padding-right: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
              }
            }
          `}</style>
        </>
      )
    },
  },
  Title: {
    fields: {
      text: {
        type: 'textarea' as const,
        label: 'text',
      },
      fontFamily: {
        type: 'select' as const,
        label: 'Font',
        options: fontOptions,
      },
      level: {
        type: 'select' as const,
        label: 'Hierarchy',
        options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
          { label: 'H4', value: 'h4' },
          { label: 'H5', value: 'h5' },
          { label: 'H6', value: 'h6' },
        ],
      },
      size: {
        type: 'text' as const,
        label: 'Font Size (px)',
        placeholder: 'Auto (based on hierarchy)',
      },
      align: {
        type: 'radio' as const,
        label: 'align',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      color: {
        type: 'select' as const,
        label: 'Text Color',
        options: textColorOptions,
      },
      maxWidth: {
        type: 'select' as const,
        label: 'Max Width',
        options: maxWidthOptions,
      },
      horizontalPadding: {
        type: 'select' as const,
        label: 'Horizontal Padding',
        options: verticalPaddingOptions,
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
    },
    defaultProps: {
      text: 'Title',
      fontFamily: 'inherit',
      level: 'h2',
      size: '',
      align: 'left',
      color: 'default',
      maxWidth: '100%',
      horizontalPadding: 16,
      verticalPadding: 8,
    },
    render: ({ text, fontFamily, level, size, align, color, maxWidth, horizontalPadding, verticalPadding }: any) => {
      useEffect(() => {
        loadGoogleFont(fontFamily)
      }, [fontFamily])
      const Tag = level || 'h2'

      // Font size based on hierarchy level (used when size is 'auto')
      const levelSizes: Record<string, number> = {
        h1: 48,
        h2: 36,
        h3: 28,
        h4: 24,
        h5: 20,
        h6: 16,
      }

      const alignStyles = {
        left: 'left' as const,
        center: 'center' as const,
        right: 'right' as const,
      }

      const textColor = resolveColor(color, branding)
      const uniqueId = `title-${Math.random().toString(36).substr(2, 9)}`

      // Use manual size if set, otherwise use hierarchy-based size
      const fontSize = !size || size === 'auto'
        ? levelSizes[level] || 36
        : (typeof size === 'number' ? size : parseInt(size) || 36)

      return (
        <>
          <Tag
            className={uniqueId}
            style={{
              fontFamily: fontFamily !== 'inherit' ? `'${fontFamily}', sans-serif` : 'inherit',
              fontWeight: '700',
              fontSize: `${fontSize}px`,
              textAlign: alignStyles[align as keyof typeof alignStyles],
              wordBreak: 'break-word',
              paddingLeft: `${horizontalPadding}px`,
              paddingRight: `${horizontalPadding}px`,
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              color: textColor,
              ...(maxWidth && maxWidth !== '100%' ? { maxWidth, ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}) } : {}),
            }}
          >
            {text}
          </Tag>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                padding-left: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
                padding-right: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
              }
            }
          `}</style>
        </>
      )
    },
  },
})
