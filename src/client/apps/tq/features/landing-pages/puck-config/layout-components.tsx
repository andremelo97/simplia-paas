import React from 'react'
import { BrandingData } from '../../../services/branding'
import { backgroundColorOptions, resolveColor } from './color-options'
import { createColorField } from './ColorPickerField'

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
      horizontalPadding: {
        type: 'select' as const,
        label: 'Horizontal Padding',
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
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      content: {
        type: 'slot' as const,
      },
    },
    defaultProps: {
      columns: 4,
      gap: 24,
      horizontalPadding: 16,
      verticalPadding: 0,
      backgroundColor: 'none',
    },
    render: ({ columns, gap, horizontalPadding, verticalPadding, backgroundColor, content: Content }: any) => {
      const bgColor = resolveColor(backgroundColor, branding)
      const uniqueId = `grid-${Math.random().toString(36).substr(2, 9)}`

      // Apply columns configuration directly
      const getGridColumns = (cols: number) => {
        if (cols <= 1) return '1fr'
        return `repeat(${cols}, 1fr)`
      }

      const wrapperId = `grid-wrapper-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          <div
            className={wrapperId}
            style={{
              width: '100%',
              overflowX: 'hidden',
              paddingLeft: `${horizontalPadding}px`,
              paddingRight: `${horizontalPadding}px`,
              backgroundColor: bgColor,
            }}
          >
            <Content
              className={uniqueId}
              style={{
                width: '100%',
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'grid',
                gridTemplateColumns: getGridColumns(columns),
                gap: `${Math.max(12, gap / 2)}px`,
                paddingTop: `${verticalPadding}px`,
                paddingBottom: `${verticalPadding}px`,
              }}
            />
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${wrapperId} {
                padding-left: ${Math.round(horizontalPadding * 1.5)}px;
                padding-right: ${Math.round(horizontalPadding * 1.5)}px;
              }
              .${uniqueId} {
                gap: ${gap}px;
              }
            }
            @media (min-width: 768px) {
              .${wrapperId} {
                padding-left: ${horizontalPadding * 2}px;
                padding-right: ${horizontalPadding * 2}px;
              }
            }
          `}</style>
        </>
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
      horizontalPadding: {
        type: 'select' as const,
        label: 'Horizontal Padding',
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
      backgroundColor: createColorField('Background Color', backgroundColorOptions, branding),
      content: {
        type: 'slot' as const,
      },
    },
    defaultProps: {
      direction: 'row',
      justifyContent: 'flex-start',
      gap: 24,
      wrap: true,
      horizontalPadding: 16,
      verticalPadding: 0,
      backgroundColor: 'none',
    },
    render: ({ direction, justifyContent, gap, wrap, horizontalPadding, verticalPadding, backgroundColor, content: Content }: any) => {
      const bgColor = resolveColor(backgroundColor, branding)
      const uniqueId = `flex-${Math.random().toString(36).substr(2, 9)}`
      const wrapperId = `flex-wrapper-${Math.random().toString(36).substr(2, 9)}`

      // Apply direction directly as CSS value
      const flexDir = direction

      return (
        <>
          <div
            className={wrapperId}
            style={{
              width: '100%',
              overflowX: 'hidden',
              paddingLeft: `${horizontalPadding}px`,
              paddingRight: `${horizontalPadding}px`,
              backgroundColor: bgColor,
            }}
          >
            <Content
              className={uniqueId}
              style={{
                width: '100%',
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                flexDirection: flexDir,
                justifyContent: justifyContent,
                gap: `${Math.max(12, gap / 2)}px`,
                flexWrap: wrap ? 'wrap' : 'nowrap',
                paddingTop: `${verticalPadding}px`,
                paddingBottom: `${verticalPadding}px`,
              }}
            />
          </div>
          <style>{`
            @media (min-width: 640px) {
              .${wrapperId} {
                padding-left: ${Math.round(horizontalPadding * 1.5)}px;
                padding-right: ${Math.round(horizontalPadding * 1.5)}px;
              }
              .${uniqueId} {
                gap: ${gap}px;
              }
            }
            @media (min-width: 768px) {
              .${wrapperId} {
                padding-left: ${horizontalPadding * 2}px;
                padding-right: ${horizontalPadding * 2}px;
              }
            }
          `}</style>
        </>
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
