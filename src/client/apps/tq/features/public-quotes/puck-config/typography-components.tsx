import React from 'react'

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

export const typographyComponents = {
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
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: verticalPaddingOptions,
      },
    },
    defaultProps: {
      text: 'Heading',
      size: 'm',
      level: 'h2',
      align: 'left',
      verticalPadding: 8,
    },
    render: ({ text, size, level, align, verticalPadding }: any) => {
      const Tag = level || 'h2'

      const sizeClasses = {
        xs: 'text-xs',
        s: 'text-sm',
        m: 'text-base',
        l: 'text-lg',
        xl: 'text-xl',
        xxl: 'text-2xl',
        xxxl: 'text-4xl',
      }

      const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      }

      return (
        <Tag
          className={`font-bold ${sizeClasses[size as keyof typeof sizeClasses]} ${alignClasses[align as keyof typeof alignClasses]}`}
          style={{
            paddingTop: `${verticalPadding}px`,
            paddingBottom: `${verticalPadding}px`,
          }}
        >
          {text}
        </Tag>
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
        type: 'radio' as const,
        label: 'color',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Muted', value: 'muted' },
        ],
      },
      maxWidth: {
        type: 'text' as const,
        label: 'maxWidth',
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
      verticalPadding: 0,
    },
    render: ({ text, size, align, color, maxWidth, verticalPadding }: any) => {
      const sizeClasses = {
        m: 'text-base',
        s: 'text-sm',
      }

      const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      }

      const colorClasses = {
        default: 'text-gray-900',
        muted: 'text-gray-600',
      }

      const styles: any = {
        paddingTop: `${verticalPadding}px`,
        paddingBottom: `${verticalPadding}px`,
      }

      if (maxWidth) {
        styles.maxWidth = maxWidth
      }

      return (
        <p
          className={`${sizeClasses[size as keyof typeof sizeClasses]} ${alignClasses[align as keyof typeof alignClasses]} ${colorClasses[color as keyof typeof colorClasses]}`}
          style={styles}
        >
          {text}
        </p>
      )
    },
  },
}
