import React, { useEffect } from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor, fontOptions, loadGoogleFont } from './color-options'

const withFallback = (value: string | undefined, fallback: string) =>
  (typeof value === 'string' && value.trim().length > 0) ? value : fallback

// Ensure URL has protocol (https:// by default)
const ensureProtocol = (url: string): string => {
  if (!url) return url
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `https://${trimmed}`
}

export const createHeaderFooterComponents = (branding: BrandingData) => ({
  Header: {
    fields: {
      // === BUTTON ACTION SETTINGS (TOP) ===
      buttonAction: {
        type: 'select' as const,
        label: 'Button Action',
        options: [
          { label: 'None (visual only)', value: 'none' },
          { label: 'Approve Quote', value: 'approve_quote' },
          { label: 'Link (URL)', value: 'link' },
          { label: 'Open Widget (iframe)', value: 'open_widget' },
        ],
      },
      buttonUrl: {
        type: 'text' as const,
        label: 'Button URL',
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
      // === HEADER SETTINGS ===
      showLogo: {
        type: 'radio' as const,
        label: 'Show Logo',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      mobileLogoDisplay: {
        type: 'select' as const,
        label: 'Mobile Logo Display',
        options: [
          { label: 'Normal', value: 'normal' },
          { label: 'Smaller', value: 'smaller' },
          { label: 'Hidden', value: 'hidden' },
        ],
      },
      mobileButtonAlign: {
        type: 'radio' as const,
        label: 'Mobile Button Alignment',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
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
      // === BUTTON APPEARANCE ===
      showButton: {
        type: 'radio' as const,
        label: 'Show Button',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      buttonLabel: {
        type: 'text' as const,
        label: 'Button Label',
      },
      buttonFontFamily: {
        type: 'select' as const,
        label: 'Button Font',
        options: fontOptions,
      },
      buttonVariant: {
        type: 'radio' as const,
        label: 'Button Style',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
          { label: 'Outline', value: 'outline' },
        ],
      },
      buttonTextColor: {
        type: 'select' as const,
        label: 'Button Text Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      showLogo: true,
      mobileLogoDisplay: 'normal',
      mobileButtonAlign: 'center',
      backgroundColor: 'white',
      height: '80',
      showButton: false,
      buttonLabel: 'Get Started',
      buttonFontFamily: 'inherit',
      buttonUrl: '#',
      buttonVariant: 'primary',
      buttonTextColor: '#ffffff',
      buttonAction: 'none',
      widgetUrl: '',
      widgetTitle: 'Widget',
      widgetHeight: '600',
    },
    resolveFields: (data: any, { fields }: any) => {
      const resolvedFields = { ...fields }

      // Hide mobile logo display if logo is not shown
      if (data.props.showLogo !== true && data.props.showLogo !== 'true') {
        delete resolvedFields.mobileLogoDisplay
        delete resolvedFields.mobileButtonAlign
      } else {
        // Show mobileButtonAlign only when logo is hidden on mobile AND button is shown
        const logoHiddenOnMobile = data.props.mobileLogoDisplay === 'hidden'
        const buttonShown = data.props.showButton === true || data.props.showButton === 'true'
        if (!logoHiddenOnMobile || !buttonShown) {
          delete resolvedFields.mobileButtonAlign
        }
      }

      // Hide button-related fields if button is not shown
      if (data.props.showButton !== true && data.props.showButton !== 'true') {
        delete resolvedFields.buttonAction
        delete resolvedFields.buttonUrl
        delete resolvedFields.widgetUrl
        delete resolvedFields.widgetTitle
        delete resolvedFields.widgetHeight
        delete resolvedFields.buttonLabel
        delete resolvedFields.buttonFontFamily
        delete resolvedFields.buttonVariant
        delete resolvedFields.buttonTextColor
      } else {
        // Show/hide action-specific fields
        if (data.props.buttonAction !== 'link') {
          delete resolvedFields.buttonUrl
        }
        if (data.props.buttonAction !== 'open_widget') {
          delete resolvedFields.widgetUrl
          delete resolvedFields.widgetTitle
          delete resolvedFields.widgetHeight
        }
      }

      return resolvedFields
    },
    render: ({ showLogo, mobileLogoDisplay, mobileButtonAlign, backgroundColor, height, showButton, buttonLabel, buttonFontFamily, buttonUrl, buttonVariant, buttonTextColor, buttonAction, widgetUrl, widgetTitle, widgetHeight }: any) => {
      useEffect(() => {
        loadGoogleFont(buttonFontFamily)
      }, [buttonFontFamily])

      // Convert string booleans to actual booleans
      const shouldShowLogo = showLogo === true || showLogo === 'true'
      const shouldShowButton = showButton === true || showButton === 'true'
      const headerButtonId = `header-btn-${Math.random().toString(36).substr(2, 9)}`
      const logoId = `header-logo-${Math.random().toString(36).substr(2, 9)}`
      const headerContainerId = `header-container-${Math.random().toString(36).substr(2, 9)}`
      const effectiveMobileLogoDisplay = mobileLogoDisplay || 'normal'
      const effectiveMobileButtonAlign = mobileButtonAlign || 'center'
      
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

      const getButtonStyles = () => {
        const baseStyles = {
          display: 'inline-flex',
          alignItems: 'center',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '10px',
          paddingBottom: '10px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          textDecoration: 'none',
          transition: 'all 0.2s',
          border: '1px solid',
        }

        const textColor = resolveColor(buttonTextColor, branding)

        switch (buttonVariant) {
          case 'primary':
            return {
              ...baseStyles,
              backgroundColor: branding.primaryColor,
              color: textColor,
              borderColor: branding.primaryColor,
            }
          case 'secondary':
            return {
              ...baseStyles,
              backgroundColor: branding.secondaryColor,
              color: textColor,
              borderColor: branding.secondaryColor,
            }
          case 'tertiary':
            return {
              ...baseStyles,
              backgroundColor: branding.tertiaryColor,
              color: textColor,
              borderColor: branding.tertiaryColor,
            }
          case 'outline':
            return {
              ...baseStyles,
              backgroundColor: 'transparent',
              color: textColor,
              borderColor: backgroundColor === 'white' ? branding.primaryColor : '#ffffff',
            }
          default:
            return baseStyles
        }
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
              className={headerContainerId}
              style={{
                maxWidth: '1152px',
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {shouldShowLogo && (
                branding.logoUrl ? (
                  <img
                    className={logoId}
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
                    className={logoId}
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: getTextColor(),
                    }}
                  >
                    LOGO
                  </span>
                )
              )}
              {!shouldShowLogo && <div />}
              {shouldShowButton && buttonLabel && (
                <button
                  className={headerButtonId}
                  data-action={buttonAction}
                  data-url={buttonUrl}
                  data-widget-url={widgetUrl}
                  data-widget-title={widgetTitle}
                  data-widget-height={widgetHeight}
                  style={{
                    ...getButtonStyles(),
                    fontFamily: buttonFontFamily !== 'inherit' ? `'${buttonFontFamily}', sans-serif` : 'inherit',
                    cursor: buttonAction !== 'none' ? 'pointer' : 'default',
                    border: 'none',
                  }}
                >
                  {buttonLabel}
                </button>
              )}
            </div>
          </header>
          {/* Spacer to compensate for fixed header */}
          <div style={{ height: `${parseInt(height)}px` }} />
          <style>{`
            @media (max-width: 768px) {
              .${headerButtonId} {
                padding-left: 12px !important;
                padding-right: 12px !important;
                padding-top: 6px !important;
                padding-bottom: 6px !important;
                font-size: 12px !important;
              }
            }
            @media (max-width: 480px) {
              ${effectiveMobileLogoDisplay === 'hidden' ? `
              .${logoId} {
                display: none !important;
              }
              .${headerContainerId} {
                justify-content: ${effectiveMobileButtonAlign === 'left' ? 'flex-start' : effectiveMobileButtonAlign === 'right' ? 'flex-end' : 'center'} !important;
              }
              ` : ''}
              ${effectiveMobileLogoDisplay === 'smaller' ? `
              .${logoId} {
                max-height: ${parseInt(height) * 0.4}px !important;
                max-width: 120px !important;
              }
              ` : ''}
            }
          `}</style>
        </>
      )
    },
  },
  Footer: {
    fields: {
      // === APPEARANCE ===
      backgroundColor: {
        type: 'radio' as const,
        label: 'Background Color',
        options: [
          { label: 'White', value: 'white' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Tertiary', value: 'tertiary' },
          { label: 'Dark', value: 'dark' },
        ],
      },
      textColor: {
        type: 'select' as const,
        label: 'Text Color',
        options: textColorOptions,
      },
      verticalPadding: {
        type: 'select' as const,
        label: 'Vertical Padding',
        options: [
          { label: '16px', value: 16 },
          { label: '24px', value: 24 },
          { label: '32px', value: 32 },
          { label: '40px', value: 40 },
          { label: '48px', value: 48 },
          { label: '56px', value: 56 },
          { label: '64px', value: 64 },
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
        ],
      },
      // === DATA SOURCE ===
      contactSource: {
        type: 'radio' as const,
        label: 'Contact & Social Data Source',
        options: [
          { label: 'Use Branding Data (Recommended)', value: 'branding' },
          { label: 'Custom (Manual Entry)', value: 'custom' },
        ],
      },
      // === SOCIAL LINKS SECTION ===
      socialTitle: {
        type: 'text' as const,
        label: 'Social Links - Title',
      },
      showSocialLinks: {
        type: 'radio' as const,
        label: 'Social Links - Show Section',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      socialLinks: {
        type: 'array' as const,
        label: 'Social Links - Items (Custom Mode)',
        arrayFields: {
          platform: {
            type: 'select' as const,
            label: 'Platform',
            options: [
              { label: 'Facebook', value: 'facebook' },
              { label: 'Instagram', value: 'instagram' },
              { label: 'X', value: 'twitter' },
              { label: 'LinkedIn', value: 'linkedin' },
              { label: 'WhatsApp', value: 'whatsapp' },
              { label: 'YouTube', value: 'youtube' },
              { label: 'Pinterest', value: 'pinterest' },
              { label: 'TikTok', value: 'tiktok' },
              { label: 'Website', value: 'website' },
            ],
          },
          url: {
            type: 'text' as const,
            label: 'URL',
          },
        },
      },
      // === QUICK LINKS SECTION ===
      quickLinksTitle: {
        type: 'text' as const,
        label: 'Quick Links - Title',
      },
      showQuickLinks: {
        type: 'radio' as const,
        label: 'Quick Links - Show Section',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      quickLinks: {
        type: 'array' as const,
        label: 'Quick Links - Items',
        arrayFields: {
          label: {
            type: 'text' as const,
            label: 'Label',
          },
          url: {
            type: 'text' as const,
            label: 'URL',
          },
        },
      },
      // === CONTACT SECTION ===
      contactTitle: {
        type: 'text' as const,
        label: 'Contact - Title',
      },
      showContact: {
        type: 'radio' as const,
        label: 'Contact - Show Section',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      // Branding mode toggles
      showEmail: {
        type: 'radio' as const,
        label: 'Contact - Show Email (Branding Mode)',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      showPhone: {
        type: 'radio' as const,
        label: 'Contact - Show Phone (Branding Mode)',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      showAddress: {
        type: 'radio' as const,
        label: 'Contact - Show Address (Branding Mode)',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      // Custom mode items
      contactItems: {
        type: 'array' as const,
        label: 'Contact - Items (Custom Mode)',
        arrayFields: {
          type: {
            type: 'select' as const,
            label: 'Type',
            options: [
              { label: 'Phone', value: 'phone' },
              { label: 'Email', value: 'email' },
              { label: 'Address', value: 'address' },
            ],
          },
          value: {
            type: 'text' as const,
            label: 'Value',
          },
        },
      },
      // === COPYRIGHT ===
      copyrightText: {
        type: 'text' as const,
        label: 'Copyright Text',
      },
    },
    // Conditionally show/hide fields based on contactSource
    resolveFields: (data: any, { fields }: any) => {
      const isBrandingMode = data.props.contactSource === 'branding'

      // Create a new fields object with conditional visibility
      const resolvedFields = { ...fields }

      if (isBrandingMode) {
        // Hide custom mode fields, show branding mode fields
        delete resolvedFields.socialLinks
        delete resolvedFields.contactItems
      } else {
        // Hide branding mode fields, show custom mode fields
        delete resolvedFields.showEmail
        delete resolvedFields.showPhone
        delete resolvedFields.showAddress
      }

      return resolvedFields
    },
    defaultProps: {
      backgroundColor: 'dark',
      contactSource: 'branding',
      showSocialLinks: true,
      socialLinks: [],
      showQuickLinks: true,
      quickLinks: [
        { label: 'Privacy Policy', url: '#privacy' },
        { label: 'Terms of Service', url: '#terms' },
      ],
      showContact: true,
      showEmail: true,
      showPhone: true,
      showAddress: true,
      contactItems: [],
      socialTitle: 'Social Media',
      quickLinksTitle: 'Quick Links',
      contactTitle: 'Contact',
      copyrightText: `Copyright ${new Date().getFullYear()} All rights reserved.`,
      verticalPadding: 32,
      horizontalPadding: 16,
      textColor: '#ffffff',
    },
    render: ({ backgroundColor, contactSource, showSocialLinks, socialLinks, showQuickLinks, quickLinks, showContact, showEmail, showPhone, showAddress, contactItems, copyrightText, verticalPadding, horizontalPadding, textColor, socialTitle, quickLinksTitle, contactTitle }: any) => {
      const getBackgroundColor = () => {
        switch (backgroundColor) {
          case 'primary':
            return branding.primaryColor
          case 'secondary':
            return branding.secondaryColor
          case 'tertiary':
            return branding.tertiaryColor
          case 'dark':
            return '#000000'
          case 'white':
          default:
            return '#ffffff'
        }
      }

      const getTextColor = () => {
        return resolveColor(textColor, branding)
      }

      const getSocialIcon = (platform: string) => {
        // All icons must be stroke-based (not fill) since SVG uses stroke="currentColor"
        const icons: any = {
          facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
          instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z',
          // X (formerly Twitter) logo
          twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
          linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
          youtube: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z M9.75 15.02l0-6.89 5.75 3.44z',
          pinterest: 'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z',
          tiktok: 'M9 12a4 4 0 104 4V4a5 5 0 005 5',
          // WhatsApp: simple chat bubble with tail (stroke-based)
          whatsapp: 'M12 3a9 9 0 00-9 9c0 1.5.4 3 1.1 4.3L3 21l4.7-1.1c1.3.7 2.8 1.1 4.3 1.1a9 9 0 000-18z',
          // Website: globe icon (stroke-based)
          website: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
        }
        return icons[platform] || icons.facebook
      }

      const getContactIcon = (type: string) => {
        const icons: any = {
          phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
          email: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
          address: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
        }
        return icons[type] || icons.phone
      }

      // Build effective contact items based on source
      // Default to 'branding' if contactSource is undefined (for backwards compatibility with saved templates)
      const effectiveContactSource = contactSource || 'branding'
      // Default show flags to true if undefined (for backwards compatibility with saved templates)
      const effectiveShowEmail = showEmail !== false
      const effectiveShowPhone = showPhone !== false
      const effectiveShowAddress = showAddress !== false

      const getEffectiveContactItems = () => {
        if (effectiveContactSource === 'branding') {
          const items: Array<{ type: string; value: string }> = []
          if (effectiveShowEmail && branding.email) {
            items.push({ type: 'email', value: branding.email })
          }
          if (effectiveShowPhone && branding.phone) {
            items.push({ type: 'phone', value: branding.phone })
          }
          if (effectiveShowAddress && branding.address) {
            items.push({ type: 'address', value: branding.address })
          }
          return items
        }
        return contactItems || []
      }

      // Build effective social links based on source
      const getEffectiveSocialLinks = () => {
        if (effectiveContactSource === 'branding' && branding.socialLinks) {
          const links: Array<{ platform: string; url: string }> = []
          const socialData = branding.socialLinks as Record<string, string | undefined>
          const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 'whatsapp', 'website']
          platforms.forEach(platform => {
            if (socialData[platform]) {
              links.push({ platform, url: socialData[platform]! })
            }
          })
          return links
        }
        return socialLinks || []
      }

      const effectiveContactItems = getEffectiveContactItems()
      const effectiveSocialLinks = getEffectiveSocialLinks()

      const uniqueId = `footer-${Math.random().toString(36).substr(2, 9)}`
      const wrapperId = `footer-wrapper-${Math.random().toString(36).substr(2, 9)}`

      const effectiveSocialTitle = withFallback(socialTitle, 'Social Media')
      const effectiveQuickLinksTitle = withFallback(quickLinksTitle, 'Quick Links')
      const effectiveContactTitle = withFallback(contactTitle, 'Contact')

      return (
        <>
          <footer
            className={wrapperId}
            style={{
              width: '100%',
              backgroundColor: getBackgroundColor(),
              borderTop: `1px solid ${backgroundColor === 'white' ? '#e5e7eb' : 'transparent'}`,
              paddingLeft: `${horizontalPadding}px`,
              paddingRight: `${horizontalPadding}px`,
              paddingTop: `${verticalPadding}px`,
              paddingBottom: `${verticalPadding}px`,
            }}
          >
            <div
              className={uniqueId}
              style={{
                width: '100%',
                maxWidth: '1152px',
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
              }}
            >
              {/* Three column grid */}
              <div className={`${uniqueId}-grid`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
                {/* Social Links */}
                {showSocialLinks && effectiveSocialLinks && effectiveSocialLinks.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: getTextColor(),
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {effectiveSocialTitle}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {effectiveSocialLinks.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={ensureProtocol(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: getTextColor(),
                            textDecoration: 'none',
                            fontSize: '14px',
                            opacity: 0.8,
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d={getSocialIcon(link.platform)} />
                          </svg>
                          <span style={{ textTransform: 'capitalize' }}>{link.platform}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                {showQuickLinks && quickLinks && quickLinks.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: getTextColor(),
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {effectiveQuickLinksTitle}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {quickLinks.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={ensureProtocol(link.url)}
                          style={{
                            color: getTextColor(),
                            textDecoration: 'none',
                            fontSize: '14px',
                            opacity: 0.8,
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {showContact && effectiveContactItems && effectiveContactItems.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: getTextColor(),
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {effectiveContactTitle}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {effectiveContactItems.map((item: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            color: getTextColor(),
                            fontSize: '14px',
                            opacity: 0.8,
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0, marginTop: '2px' }}
                          >
                            <path d={getContactIcon(item.type)} />
                          </svg>
                          <span style={{ wordBreak: 'break-word' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Copyright */}
              {copyrightText && (
                <div
                  style={{
                    fontSize: '14px',
                    color: getTextColor(),
                    opacity: 0.6,
                    paddingTop: '16px',
                    borderTop: `1px solid ${backgroundColor === 'white' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}`,
                    textAlign: 'center',
                  }}
                >
                  {copyrightText}
                </div>
              )}
            </div>
          </footer>

          <style>{`
            @media (max-width: 768px) {
              .${uniqueId}-grid {
                grid-template-columns: 1fr !important;
                gap: 24px !important;
              }
            }
            @media (min-width: 640px) {
              .${wrapperId} {
                padding-left: ${Math.round(horizontalPadding * 1.5)}px;
                padding-right: ${Math.round(horizontalPadding * 1.5)}px;
              }
              .${uniqueId} > div:first-child {
                grid-template-columns: 1fr 1fr 1fr;
              }
            }
            @media (min-width: 768px) {
              .${wrapperId} {
                padding-left: ${horizontalPadding * 2}px;
                padding-right: ${horizontalPadding * 2}px;
              }
            }
            @media (max-width: 639px) {
              .${uniqueId} > div:first-child {
                grid-template-columns: 1fr;
                gap: 24px;
              }
            }
          `}</style>
        </>
      )
    },
  },
})
