import React, { useEffect } from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor, fontOptions, loadGoogleFont } from './color-options'

export const createActionComponents = (branding: BrandingData) => ({
  Button: {
    fields: {
      // === ACTION SETTINGS (TOP) ===
      action: {
        type: 'select' as const,
        label: 'Action',
        options: [
          { label: 'None (visual only)', value: 'none' },
          { label: 'Approve Quote', value: 'approve_quote' },
          { label: 'Link (URL)', value: 'link' },
          { label: 'Open Widget (iframe)', value: 'open_widget' },
        ],
      },
      url: {
        type: 'text' as const,
        label: 'URL (for Link action)',
      },
      widgetUrl: {
        type: 'text' as const,
        label: 'Widget URL (iframe src)',
      },
      widgetTitle: {
        type: 'text' as const,
        label: 'Widget Modal Title',
      },
      widgetHeight: {
        type: 'select' as const,
        label: 'Widget Height',
        options: [
          { label: 'Small (400px)', value: '400' },
          { label: 'Medium (600px)', value: '600' },
          { label: 'Large (800px)', value: '800' },
          { label: 'Full Screen', value: '100vh' },
        ],
      },
      // === BUTTON SETTINGS ===
      text: {
        type: 'text' as const,
        label: 'Button Text',
      },
      fontFamily: {
        type: 'select' as const,
        label: 'Font',
        options: fontOptions,
      },
      style: {
        type: 'radio' as const,
        label: 'Style',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
          { label: 'Outline', value: 'outline' }
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
      align: {
        type: 'radio' as const,
        label: 'Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
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
      fontFamily: 'inherit',
      action: 'none',
      url: '',
      widgetUrl: '',
      widgetTitle: 'Widget',
      widgetHeight: '600',
      style: 'primary',
      size: 'md',
      align: 'left',
      textColor: '#ffffff',
    },
    resolveFields: (data: any, { fields }: any) => {
      // Show/hide fields based on action type
      const resolvedFields = { ...fields }

      if (data.props.action !== 'link') {
        delete resolvedFields.url
      }
      if (data.props.action !== 'open_widget') {
        delete resolvedFields.widgetUrl
        delete resolvedFields.widgetTitle
        delete resolvedFields.widgetHeight
      }

      return resolvedFields
    },
    render: ({ text, fontFamily, action, url, widgetUrl, widgetTitle, widgetHeight, style, size, align, textColor }: any) => {
      useEffect(() => {
        loadGoogleFont(fontFamily)
      }, [fontFamily])
      const getAlignStyle = (align: string) => {
        switch (align) {
          case 'center':
            return { display: 'flex', justifyContent: 'center' }
          case 'right':
            return { display: 'flex', justifyContent: 'flex-end' }
          default:
            return { display: 'flex', justifyContent: 'flex-start' }
        }
      }

      const getStyleConfig = (style: string) => {
        switch (style) {
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
          case 'outline':
            return {
              backgroundColor: 'transparent',
              borderColor: branding.primaryColor
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
        <div style={{ width: '100%', ...getAlignStyle(align) }}>
          <button
            className={uniqueId}
            data-action={action}
            data-url={url}
            data-widget-url={widgetUrl}
            data-widget-title={widgetTitle}
            data-widget-height={widgetHeight}
            style={{
              display: 'inline-block',
              width: 'fit-content',
              borderRadius: '4px',
              fontFamily: fontFamily !== 'inherit' ? `'${fontFamily}', sans-serif` : 'inherit',
              fontWeight: '500',
              border: '1px solid',
              wordBreak: 'break-word',
              cursor: action !== 'none' ? 'pointer' : 'default',
              ...baseSizeStyles[size as keyof typeof baseSizeStyles],
              ...getStyleConfig(style),
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
        </div>
      )
    },
  },
})
