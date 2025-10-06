import React from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor } from './color-options'

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
  Heading: {
    fields: {
      text: {
        type: 'textarea' as const,
        label: 'text',
      },
      size: {
        type: 'select' as const,
        label: 'size',
        options: [
          { label: 'XXXL', value: 'xxxl' },
          { label: 'XXL', value: 'xxl' },
          { label: 'XL', value: 'xl' },
          { label: 'L', value: 'l' },
          { label: 'M', value: 'm' },
          { label: 'S', value: 's' },
          { label: 'XS', value: 'xs' },
        ],
      },
      level: {
        type: 'select' as const,
        label: 'level',
        options: [
          { label: 'H1', value: 'h1' },
          { label: 'H2', value: 'h2' },
          { label: 'H3', value: 'h3' },
          { label: 'H4', value: 'h4' },
          { label: 'H5', value: 'h5' },
          { label: 'H6', value: 'h6' },
        ],
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
      color: {
        type: 'select' as const,
        label: 'Text Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      text: 'Heading',
      size: 'm',
      level: 'h2',
      align: 'left',
      horizontalPadding: 16,
      verticalPadding: 8,
      color: 'default',
    },
    render: ({ text, size, level, align, horizontalPadding, verticalPadding, color }: any) => {
      const Tag = level || 'h2'

      const baseSizeStyles = {
        xs: { fontSize: '12px' },
        s: { fontSize: '14px' },
        m: { fontSize: '16px' },
        l: { fontSize: '18px' },
        xl: { fontSize: '20px' },
        xxl: { fontSize: '24px' },
        xxxl: { fontSize: '30px' },
      }

      const alignStyles = {
        left: 'left' as const,
        center: 'center' as const,
        right: 'right' as const,
      }

      const textColor = resolveColor(color, branding)
      const uniqueId = `heading-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <Tag
            className={uniqueId}
            style={{
              fontWeight: '700',
              ...baseSizeStyles[size as keyof typeof baseSizeStyles],
              textAlign: alignStyles[align as keyof typeof alignStyles],
              wordBreak: 'break-word',
              paddingLeft: `${horizontalPadding}px`,
              paddingRight: `${horizontalPadding}px`,
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
              color: textColor,
            }}
          >
            {text}
          </Tag>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                padding-left: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
                padding-right: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
                ${size === 's' ? 'font-size: 16px;' : ''}
                ${size === 'm' ? 'font-size: 18px;' : ''}
                ${size === 'l' ? 'font-size: 20px;' : ''}
                ${size === 'xl' ? 'font-size: 24px;' : ''}
                ${size === 'xxl' ? 'font-size: 30px;' : ''}
                ${size === 'xxxl' ? 'font-size: 36px;' : ''}
              }
            }
            @media (min-width: 768px) {
              .${uniqueId} {
                ${size === 'xxl' ? 'font-size: 36px;' : ''}
                ${size === 'xxxl' ? 'font-size: 48px;' : ''}
              }
            }
            @media (min-width: 1024px) {
              .${uniqueId} {
                ${size === 'xxxl' ? 'font-size: 60px;' : ''}
              }
            }
          `}</style>
        </>
      )
    },
  },
  Text: {
    fields: {
      text: {
        type: 'textarea' as const,
        label: 'text',
      },
      size: {
        type: 'select' as const,
        label: 'size',
        options: [
          { label: 'M', value: 'm' },
          { label: 'S', value: 's' },
        ],
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
        type: 'text' as const,
        label: 'maxWidth',
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
      text: 'Text',
      size: 'm',
      align: 'left',
      color: 'default',
      maxWidth: '',
      horizontalPadding: 16,
      verticalPadding: 0,
    },
    render: ({ text, size, align, color, maxWidth, horizontalPadding, verticalPadding }: any) => {
      const baseSizeStyles = {
        m: { fontSize: '14px' },
        s: { fontSize: '12px' },
      }

      const alignStyles = {
        left: 'left' as const,
        center: 'center' as const,
        right: 'right' as const,
      }

      const textColor = resolveColor(color, branding)
      const uniqueId = `text-${Math.random().toString(36).substr(2, 9)}`

      const styles: any = {
        ...baseSizeStyles[size as keyof typeof baseSizeStyles],
        textAlign: alignStyles[align as keyof typeof alignStyles],
        wordBreak: 'break-word',
        paddingLeft: `${horizontalPadding}px`,
        paddingRight: `${horizontalPadding}px`,
        paddingTop: `${verticalPadding}px`,
        paddingBottom: `${verticalPadding}px`,
        color: textColor,
      }

      if (maxWidth) {
        styles.maxWidth = maxWidth
      }

      return (
        <>
          <p className={uniqueId} style={styles}>
            {text}
          </p>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                padding-left: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
                padding-right: ${horizontalPadding === 16 ? 0 : horizontalPadding}px;
                ${size === 'm' ? 'font-size: 16px;' : ''}
                ${size === 's' ? 'font-size: 14px;' : ''}
              }
            }
          `}</style>
        </>
      )
    },
  },
})
