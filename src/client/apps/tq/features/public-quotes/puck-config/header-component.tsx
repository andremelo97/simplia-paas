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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              backgroundColor: getBackgroundColor(),
              borderBottom: `1px solid ${backgroundColor === 'white' ? '#e5e7eb' : 'transparent'}`,
              height: `${parseInt(height)}px`,
              paddingLeft: '32px',
              paddingRight: '32px',
            }}
          >
            <div
              style={{
                maxWidth: '1152px',
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              }}
            >
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
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: getTextColor(),
                  }}
                >
                  LOGO
                </span>
              )}
            </div>
          </header>
          {/* Spacer to compensate for fixed header */}
          <div style={{ height: `${parseInt(height)}px` }} />
        </>
      )
    },
  },
})
