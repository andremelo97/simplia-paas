import React from 'react'
import { BrandingData } from '../../../services/branding'

export const createHeaderComponent = (branding: BrandingData) => ({
  Header: {
    fields: {
      backgroundColor: {
        type: 'radio' as const,
        label: 'Background Color',
        options: [
          { label: 'White', value: 'white' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
        ],
      },
      height: {
        type: 'select' as const,
        label: 'Height',
        options: [
          { label: 'Small (64px)', value: '64' },
          { label: 'Medium (80px)', value: '80' },
          { label: 'Large (96px)', value: '96' },
        ],
      },
    },
    defaultProps: {
      backgroundColor: 'white',
      height: '80',
    },
    render: ({ backgroundColor, height }: any) => {
      const getBackgroundColor = () => {
        switch (backgroundColor) {
          case 'primary':
            return branding.primaryColor
          case 'secondary':
            return branding.secondaryColor
          case 'tertiary':
            return branding.tertiaryColor
          case 'white':
          default:
            return '#ffffff'
        }
      }

      const getTextColor = () => {
        return backgroundColor === 'white' ? '#111827' : '#ffffff'
      }

      return (
        <>
          <header
            className="fixed top-0 left-0 right-0 z-50 border-b px-8"
            style={{
              backgroundColor: getBackgroundColor(),
              borderBottomColor: backgroundColor === 'white' ? '#e5e7eb' : 'transparent',
              height: `${height}px`,
            }}
          >
            <div className="max-w-6xl mx-auto h-full flex items-center">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  style={{
                    maxHeight: `${parseInt(height) * 0.6}px`,
                    maxWidth: '200px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <span
                  className="text-2xl font-bold"
                  style={{ color: getTextColor() }}
                >
                  LOGO
                </span>
              )}
            </div>
          </header>
          {/* Spacer to compensate for fixed header */}
          <div style={{ height: `${height}px` }} />
        </>
      )
    },
  },
})
