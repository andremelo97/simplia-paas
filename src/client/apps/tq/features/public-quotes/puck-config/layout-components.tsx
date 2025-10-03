import React from 'react'
import { BrandingData } from '../../../services/branding'

export const createLayoutComponents = (branding: BrandingData) => ({
  Grid: {
    fields: {
      columns: {
        type: 'number' as const,
        label: 'Number of columns',
        min: 1,
        max: 12,
      },
      gap: {
        type: 'number' as const,
        label: 'Gap',
        min: 0,
        max: 100,
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: [
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
        ],
      },
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
          { label: 'White', value: '#ffffff' },
          { label: 'Light Gray', value: '#f9fafb' },
          { label: 'Gray', value: '#f3f4f6' },
          { label: 'Dark Gray', value: '#e5e7eb' },
          { label: 'Black', value: '#111827' },
          { label: 'Blue', value: '#3b82f6' },
          { label: 'Red', value: '#ef4444' },
          { label: 'Green', value: '#10b981' },
          { label: 'Yellow', value: '#f59e0b' },
          { label: 'Purple', value: '#8b5cf6' },
          { label: 'Pink', value: '#ec4899' },
        ],
      },
      content: {
        type: 'slot' as const,
      },
    },
    defaultProps: {
      columns: 4,
      gap: 24,
      verticalPadding: 0,
      backgroundColor: 'none',
    },
    render: ({ columns, gap, verticalPadding, backgroundColor, content: Content }: any) => {
      const getBackgroundColor = () => {
        if (backgroundColor === 'none') return 'transparent'
        if (backgroundColor === 'primary') return branding.primaryColor
        if (backgroundColor === 'secondary') return branding.secondaryColor
        if (backgroundColor === 'tertiary') return branding.tertiaryColor
        return backgroundColor
      }

      return (
        <div
          className="px-8"
          style={{
            backgroundColor: getBackgroundColor(),
          }}
        >
          <Content
            className="max-w-6xl mx-auto"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns || 4}, 1fr)`,
              gap: `${gap}px`,
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
            }}
          />
        </div>
      )
    },
  },
  Flex: {
    fields: {
      direction: {
        type: 'radio' as const,
        label: 'Direction',
        options: [
          { label: 'Row', value: 'row' },
          { label: 'Column', value: 'column' },
        ],
      },
      justifyContent: {
        type: 'radio' as const,
        label: 'Justify Content',
        options: [
          { label: 'Start', value: 'flex-start' },
          { label: 'Center', value: 'center' },
          { label: 'End', value: 'flex-end' },
        ],
      },
      gap: {
        type: 'number' as const,
        label: 'Gap',
        min: 0,
        max: 100,
      },
      wrap: {
        type: 'radio' as const,
        label: 'Wrap',
        options: [
          { label: 'true', value: true },
          { label: 'false', value: false },
        ],
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: [
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
        ],
      },
      backgroundColor: {
        type: 'select' as const,
        label: 'Background Color',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
          { label: 'White', value: '#ffffff' },
          { label: 'Light Gray', value: '#f9fafb' },
          { label: 'Gray', value: '#f3f4f6' },
          { label: 'Dark Gray', value: '#e5e7eb' },
          { label: 'Black', value: '#111827' },
          { label: 'Blue', value: '#3b82f6' },
          { label: 'Red', value: '#ef4444' },
          { label: 'Green', value: '#10b981' },
          { label: 'Yellow', value: '#f59e0b' },
          { label: 'Purple', value: '#8b5cf6' },
          { label: 'Pink', value: '#ec4899' },
        ],
      },
      content: {
        type: 'slot' as const,
      },
    },
    defaultProps: {
      direction: 'row',
      justifyContent: 'flex-start',
      gap: 24,
      wrap: true,
      verticalPadding: 0,
      backgroundColor: 'none',
    },
    render: ({ direction, justifyContent, gap, wrap, verticalPadding, backgroundColor, content: Content }: any) => {
      const getBackgroundColor = () => {
        if (backgroundColor === 'none') return 'transparent'
        if (backgroundColor === 'primary') return branding.primaryColor
        if (backgroundColor === 'secondary') return branding.secondaryColor
        if (backgroundColor === 'tertiary') return branding.tertiaryColor
        return backgroundColor
      }

      return (
        <div
          className="px-8"
          style={{
            backgroundColor: getBackgroundColor(),
          }}
        >
          <Content
            className="max-w-6xl mx-auto"
            style={{
              display: 'flex',
              flexDirection: direction,
              justifyContent: justifyContent,
              gap: `${gap}px`,
              flexWrap: wrap ? 'wrap' : 'nowrap',
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
            }}
          />
        </div>
      )
    },
  },
  Space: {
    fields: {
      size: {
        type: 'select' as const,
        label: 'Size',
        options: [
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
        ],
      },
      direction: {
        type: 'radio' as const,
        label: 'Direction',
        options: [
          { label: 'Vertical', value: 'vertical' },
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Both', value: 'both' },
        ],
      },
    },
    defaultProps: {
      size: 24,
      direction: 'vertical',
    },
    render: ({ size, direction }: any) => {
      const styles: any = {}

      if (direction === 'vertical') {
        styles.height = `${size}px`
      } else if (direction === 'horizontal') {
        styles.width = `${size}px`
        styles.display = 'inline-block'
      } else if (direction === 'both') {
        styles.height = `${size}px`
        styles.width = `${size}px`
      }

      return <div style={styles} />
    },
  },
})
