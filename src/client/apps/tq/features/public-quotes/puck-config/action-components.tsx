import React from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor } from './color-options'

export const createActionComponents = (branding: BrandingData) => ({
  Button: {
    fields: {
      label: {
        type: 'text' as const,
      },
      variant: {
        type: 'select' as const,
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' }
        ],
      },
      size: {
        type: 'select' as const,
        options: [
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
          { label: 'Large', value: 'lg' },
        ],
      },
      textColor: {
        type: 'select' as const,
        label: 'Text Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      text: 'Click here',
      variant: 'primary',
      size: 'md',
      textColor: '#ffffff',
    },
    render: ({ text, variant, size, textColor }: any) => {
      const getVariantStyles = (variant: string) => {
        switch (variant) {
          case 'primary':
            return {
              backgroundColor: branding.primaryColor,
              borderColor: branding.primaryColor
            }
          case 'secondary':
            return {
              backgroundColor: branding.secondaryColor,
              borderColor: branding.secondaryColor
            }
          case 'tertiary':
            return {
              backgroundColor: branding.tertiaryColor,
              borderColor: branding.tertiaryColor
            }
          default:
            return {
              backgroundColor: branding.primaryColor,
              borderColor: branding.primaryColor
            }
        }
      }

      const buttonTextColor = resolveColor(textColor, branding)
      const uniqueId = `button-${Math.random().toString(36).substr(2, 9)}`

      const baseSizeStyles = {
        sm: { paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', fontSize: '12px' },
        md: { paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px' },
        lg: { paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px', fontSize: '16px' },
      }

      return (
        <>
          <button
            className={uniqueId}
            style={{
              borderRadius: '4px',
              fontWeight: '500',
              border: '1px solid',
              wordBreak: 'break-word',
              ...baseSizeStyles[size as keyof typeof baseSizeStyles],
              ...getVariantStyles(variant),
              color: buttonTextColor,
            }}
          >
            {text}
          </button>
          <style>{`
            @media (min-width: 640px) {
              .${uniqueId} {
                ${size === 'sm' ? 'padding-left: 16px; padding-right: 16px; padding-top: 8px; padding-bottom: 8px; font-size: 14px;' : ''}
                ${size === 'md' ? 'padding-left: 24px; padding-right: 24px; padding-top: 10px; padding-bottom: 10px; font-size: 16px;' : ''}
                ${size === 'lg' ? 'padding-left: 32px; padding-right: 32px; padding-top: 12px; padding-bottom: 12px; font-size: 18px;' : ''}
              }
            }
          `}</style>
        </>
      )
    },
  },
})
