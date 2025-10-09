import React from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor } from './color-options'

export const createHeaderFooterComponents = (branding: BrandingData) => ({
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
      buttonUrl: {
        type: 'text' as const,
        label: 'Button URL',
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
      backgroundColor: 'white',
      height: '80',
      showButton: false,
      buttonLabel: 'Get Started',
      buttonUrl: '#',
      buttonVariant: 'primary',
      buttonTextColor: '#ffffff',
    },
    render: ({ backgroundColor, height, showButton, buttonLabel, buttonUrl, buttonVariant, buttonTextColor }: any) => {
      const headerButtonId = `header-btn-${Math.random().toString(36).substr(2, 9)}`
      
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
              style={{
                maxWidth: '1152px',
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              {showButton && buttonLabel && (
                <a
                  href={buttonUrl}
                  className={headerButtonId}
                  style={getButtonStyles()}
                >
                  {buttonLabel}
                </a>
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
          `}</style>
        </>
      )
    },
  },
  Footer: {
    fields: {
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
      showSocialLinks: {
        type: 'radio' as const,
        label: 'Show Social Links',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      socialLinks: {
        type: 'array' as const,
        label: 'Social Links',
        arrayFields: {
          platform: {
            type: 'select' as const,
            label: 'Platform',
            options: [
              { label: 'Facebook', value: 'facebook' },
              { label: 'Instagram', value: 'instagram' },
              { label: 'Twitter/X', value: 'twitter' },
              { label: 'LinkedIn', value: 'linkedin' },
              { label: 'YouTube', value: 'youtube' },
              { label: 'TikTok', value: 'tiktok' },
            ],
          },
          url: {
            type: 'text' as const,
            label: 'URL',
          },
        },
      },
      showQuickLinks: {
        type: 'radio' as const,
        label: 'Show Quick Links',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      quickLinks: {
        type: 'array' as const,
        label: 'Quick Links',
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
      showContact: {
        type: 'radio' as const,
        label: 'Show Contact',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      contactItems: {
        type: 'array' as const,
        label: 'Contact Items',
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
      copyrightText: {
        type: 'text' as const,
        label: 'Copyright Text',
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
      textColor: {
        type: 'select' as const,
        label: 'Text Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      backgroundColor: 'dark',
      showSocialLinks: true,
      socialLinks: [
        { platform: 'facebook', url: 'https://facebook.com' },
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
      ],
      showQuickLinks: true,
      quickLinks: [
        { label: 'Privacy Policy', url: '#privacy' },
        { label: 'Terms of Service', url: '#terms' },
        { label: 'Contact', url: '#contact' },
      ],
      showContact: true,
      contactItems: [
        { type: 'phone', value: '+1 (555) 123-4567' },
        { type: 'email', value: 'contact@example.com' },
        { type: 'address', value: '123 Main St, City, State 12345' },
      ],
      copyrightText: `© ${new Date().getFullYear()} All rights reserved.`,
      verticalPadding: 32,
      horizontalPadding: 16,
      textColor: '#ffffff',
    },
    render: ({ backgroundColor, showSocialLinks, socialLinks, showQuickLinks, quickLinks, showContact, contactItems, copyrightText, verticalPadding, horizontalPadding, textColor }: any) => {
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
        const icons: any = {
          facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
          instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z',
          twitter: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
          linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
          youtube: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z M9.75 15.02l0-6.89 5.75 3.44z',
          tiktok: 'M9 12a4 4 0 104 4V4a5 5 0 005 5',
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

      const uniqueId = `footer-${Math.random().toString(36).substr(2, 9)}`
      const wrapperId = `footer-wrapper-${Math.random().toString(36).substr(2, 9)}`

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
                {showSocialLinks && socialLinks && socialLinks.length > 0 && (
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
                      SOCIAL MEDIA
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {socialLinks.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
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
                      QUICK LINKS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {quickLinks.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
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
                {showContact && contactItems && contactItems.length > 0 && (
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
                      CONTACT
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {contactItems.map((item: any, index: number) => (
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
