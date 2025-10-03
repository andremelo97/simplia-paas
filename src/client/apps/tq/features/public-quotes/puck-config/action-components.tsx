import React from 'react'
import { BrandingData } from '../../../services/branding'

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
    },
    defaultProps: {
      text: 'Click here',
      variant: 'primary',
      size: 'md',
    },
    render: ({ text, variant, size }: any) => {
      const getVariantStyles = (variant: string) => {
        switch (variant) {
          case 'primary':
            return {
              backgroundColor: branding.primaryColor,
              color: 'white',
              borderColor: branding.primaryColor
            }
          case 'secondary':
            return {
              backgroundColor: branding.secondaryColor,
              color: 'white',
              borderColor: branding.secondaryColor
            }
          case 'tertiary':
            return {
              backgroundColor: branding.tertiaryColor,
              color: 'white',
              borderColor: branding.tertiaryColor
            }
          default:
            return {
              backgroundColor: branding.primaryColor,
              color: 'white',
              borderColor: branding.primaryColor
            }
        }
      }

      const sizeClasses = {
        sm: 'px-4 py-1 text-sm',
        md: 'px-6 py-2 text-base',
        lg: 'px-8 py-3 text-lg',
      }

      return (
        <button
          className={`rounded font-medium border ${sizeClasses[size as keyof typeof sizeClasses]}`}
          style={getVariantStyles(variant)}
        >
          {text}
        </button>
      )
    },
  },
})
