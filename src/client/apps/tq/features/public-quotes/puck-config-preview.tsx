import { BrandingData } from '../../services/branding'
import { createConfig } from './puck-config'

interface QuotePreviewLabels {
  quoteNumber: string
  total: string
  noItems: string
  item: string
  quantity: string
  price: string
  discount: string
}

interface FooterLabels {
  socialTitle: string
  quickLinksTitle: string
  contactTitle: string
}

interface QuotePreviewOptions {
  labels?: Partial<QuotePreviewLabels>
  footerLabels?: Partial<FooterLabels>
  accessToken?: string
  onApprove?: () => void
}

const defaultLabels: QuotePreviewLabels = {
  quoteNumber: 'Quote #',
  total: 'Total',
  noItems: 'No items in this quote',
  item: 'Item',
  quantity: 'Qty',
  price: 'Price',
  discount: 'Discount'
}

const defaultFooterLabels: FooterLabels = {
  socialTitle: 'Social Media',
  quickLinksTitle: 'Quick Links',
  contactTitle: 'Contact'
}

const getEffectiveLabel = (value: string | undefined, fallback: string) =>
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

/**
 * Create Puck config with resolved quote data for preview
 * This overrides the quote components to render actual values instead of placeholders
 */
export const createConfigWithResolvedData = (
  branding: BrandingData,
  quoteData: any,
  options: QuotePreviewOptions = {}
) => {
  const baseConfig = createConfig(branding)
  const labels: QuotePreviewLabels = {
    ...defaultLabels,
    ...(options.labels || {})
  }
  const footerLabels: FooterLabels = {
    ...defaultFooterLabels,
    ...(options.footerLabels || {})
  }

  const resolveColor = (color: string) => {
    const colors: Record<string, string> = {
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      accent: branding.tertiaryColor,
      gray: '#6b7280',
      black: '#000000'
    }
    return colors[color] || branding.primaryColor
  }

  const footerOverride = baseConfig.components.Footer
    ? {
        Footer: {
          ...baseConfig.components.Footer,
          render: (props: any) =>
            baseConfig.components.Footer.render({
              ...props,
              socialTitle: getEffectiveLabel(props?.socialTitle, footerLabels.socialTitle),
              quickLinksTitle: getEffectiveLabel(props?.quickLinksTitle, footerLabels.quickLinksTitle),
              contactTitle: getEffectiveLabel(props?.contactTitle, footerLabels.contactTitle)
            })
        }
      }
    : {}

  // Override quote components to render resolved values
  return {
    ...baseConfig,
    components: {
      ...baseConfig.components,
      // Override Button to handle actions
      Button: {
        ...baseConfig.components.Button,
        render: ({ text, action, url, style, size, align, textColor }: any) => {
          const getAlignStyle = (a: string) => {
            switch (a) {
              case 'center':
                return { display: 'flex', justifyContent: 'center' }
              case 'right':
                return { display: 'flex', justifyContent: 'flex-end' }
              default:
                return { display: 'flex', justifyContent: 'flex-start' }
            }
          }

          const getStyleConfig = (s: string) => {
            switch (s) {
              case 'primary':
                return { backgroundColor: branding.primaryColor, borderColor: branding.primaryColor }
              case 'secondary':
                return { backgroundColor: branding.secondaryColor, borderColor: branding.secondaryColor }
              case 'tertiary':
                return { backgroundColor: branding.tertiaryColor, borderColor: branding.tertiaryColor }
              case 'outline':
                return { backgroundColor: 'transparent', borderColor: branding.primaryColor }
              default:
                return { backgroundColor: branding.primaryColor, borderColor: branding.primaryColor }
            }
          }

          const resolveTextColor = (color: string) => {
            const colors: Record<string, string> = {
              primary: branding.primaryColor,
              secondary: branding.secondaryColor,
              tertiary: branding.tertiaryColor,
            }
            return colors[color] || color
          }

          const buttonTextColor = resolveTextColor(textColor)
          const uniqueId = `button-${Math.random().toString(36).substr(2, 9)}`

          const baseSizeStyles = {
            sm: { paddingLeft: '12px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', fontSize: '12px' },
            md: { paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', fontSize: '14px' },
            lg: { paddingLeft: '24px', paddingRight: '24px', paddingTop: '10px', paddingBottom: '10px', fontSize: '16px' },
          }

          const handleClick = () => {
            if (action === 'approve_quote' && options.onApprove) {
              options.onApprove()
            } else if (action === 'link' && url) {
              window.open(ensureProtocol(url), '_blank', 'noopener,noreferrer')
            }
          }

          return (
            <div style={{ width: '100%', ...getAlignStyle(align) }}>
              <button
                className={uniqueId}
                onClick={handleClick}
                style={{
                  display: 'inline-block',
                  width: 'fit-content',
                  borderRadius: '4px',
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
        }
      },
      // Override Header to handle button actions
      Header: {
        ...baseConfig.components.Header,
        render: ({ backgroundColor, height, showButton, buttonLabel, buttonUrl, buttonVariant, buttonTextColor, buttonAction }: any) => {
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

          const resolveTextColor = (color: string) => {
            const colors: Record<string, string> = {
              primary: branding.primaryColor,
              secondary: branding.secondaryColor,
              tertiary: branding.tertiaryColor,
            }
            return colors[color] || color
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
              cursor: buttonAction !== 'none' ? 'pointer' : 'default',
            }

            const textColor = resolveTextColor(buttonTextColor)

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

          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault()
            if (buttonAction === 'approve_quote' && options.onApprove) {
              options.onApprove()
            } else if (buttonAction === 'link' && buttonUrl) {
              window.open(ensureProtocol(buttonUrl), '_blank', 'noopener,noreferrer')
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
                    <button
                      onClick={handleClick}
                      className={headerButtonId}
                      style={getButtonStyles() as React.CSSProperties}
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
              `}</style>
            </>
          )
        },
      },
      QuoteNumber: {
        ...baseConfig.components.QuoteNumber,
        render: ({ label, size = 'm' }: any) => {
          const baseSizeStyles = {
            xs: { label: '12px', number: '14px' },
            s: { label: '14px', number: '16px' },
            m: { label: '16px', number: '18px' },
            l: { label: '18px', number: '20px' },
            xl: { label: '20px', number: '24px' },
            xxl: { label: '24px', number: '30px' },
            xxxl: { label: '30px', number: '36px' }
          }

          const responsiveSizeStyles = {
            xs: { label: '14px', number: '16px' },
            s: { label: '16px', number: '18px' },
            m: { label: '18px', number: '20px' },
            l: { label: '20px', number: '24px' },
            xl: { label: '24px', number: '30px' },
            xxl: { label: '30px', number: '36px' },
            xxxl: { label: '36px', number: '42px' }
          }

          const sizeStyle = baseSizeStyles[size as keyof typeof baseSizeStyles]
          const responsiveStyle = responsiveSizeStyles[size as keyof typeof responsiveSizeStyles]
          const uniqueId = `quote-number-${Math.random().toString(36).substr(2, 9)}`
          const effectiveLabel = getEffectiveLabel(label, labels.quoteNumber)

          return (
            <>
              <div className={uniqueId} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span className={`${uniqueId}-label`} style={{ fontSize: sizeStyle.label, fontWeight: '500', color: '#4b5563' }}>
                  {effectiveLabel}
                </span>
                <span className={`${uniqueId}-number`} style={{ fontSize: sizeStyle.number, fontWeight: '700', color: '#111827' }}>
                  {quoteData?.quote?.number || 'N/A'}
                </span>
              </div>
              <style>{`
                @media (min-width: 640px) {
                  .${uniqueId}-label {
                    font-size: ${responsiveStyle.label};
                  }
                  .${uniqueId}-number {
                    font-size: ${responsiveStyle.number};
                  }
                }
              `}</style>
            </>
          )
        }
      },
      QuoteTotal: {
        ...baseConfig.components.QuoteTotal,
        render: ({ label, totalColor }: any) => {
          const totalColorResolved = resolveColor(totalColor)
          const effectiveLabel = getEffectiveLabel(label, labels.total)

          return (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>
                {effectiveLabel}:
              </span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: totalColorResolved }}>
                {quoteData?.quote?.total || '$0.00'}
              </span>
            </div>
          )
        }
      },
      QuoteItems: {
        ...baseConfig.components.QuoteItems,
        render: ({
          showPrice,
          showDiscount,
          emptyMessage,
          itemLabel,
          quantityLabel,
          priceLabel,
          discountLabel,
          totalLabel
        }: any) => {
          const uniqueId = `quote-items-${Math.random().toString(36).substr(2, 9)}`
          const items = quoteData?.items || []

          const effectiveEmptyMessage = getEffectiveLabel(emptyMessage, labels.noItems)
          const effectiveItemLabel = getEffectiveLabel(itemLabel, labels.item)
          const effectiveQuantityLabel = getEffectiveLabel(quantityLabel, labels.quantity)
          const effectivePriceLabel = getEffectiveLabel(priceLabel, labels.price)
          const effectiveDiscountLabel = getEffectiveLabel(discountLabel, labels.discount)
          const effectiveTotalLabel = getEffectiveLabel(totalLabel, labels.total)

          if (items.length === 0) {
            return (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                {effectiveEmptyMessage}
              </div>
            )
          }

          return (
            <>
              {/* Mobile/Tablet: Card layout */}
              <div className={`${uniqueId}-mobile`} style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                          {item.description}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                          <div>
                            <span style={{ color: '#6b7280' }}>{effectiveQuantityLabel}:</span>
                            <span style={{ marginLeft: '8px', fontWeight: '600' }}>{item.quantity}</span>
                          </div>
                          {showPrice && (
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: '#6b7280' }}>{effectivePriceLabel}:</span>
                              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{item.base_price}</span>
                            </div>
                          )}
                          {showDiscount && (
                            <>
                              <div>
                                <span style={{ color: '#6b7280' }}>{effectiveDiscountLabel}:</span>
                                <span style={{ marginLeft: '8px', fontWeight: '600', color: '#ef4444' }}>{item.discount}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ color: '#6b7280' }}>{effectiveTotalLabel}:</span>
                                <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>
                                  {item.final_price}
                                </span>
                              </div>
                            </>
                          )}
                          {!showDiscount && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                              <span style={{ color: '#6b7280' }}>{effectiveTotalLabel}:</span>
                              <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>
                                {item.final_price}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Table layout */}
              <div className={`${uniqueId}-desktop`} style={{ width: '100%', display: 'none' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          {effectiveItemLabel}
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          {effectiveQuantityLabel}
                        </th>
                        {showPrice && (
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            {effectivePriceLabel}
                          </th>
                        )}
                        {showDiscount && (
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            {effectiveDiscountLabel}
                          </th>
                        )}
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          {effectiveTotalLabel}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, index: number) => (
                        <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.description}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{item.quantity}</td>
                          {showPrice && (
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{item.base_price}</td>
                          )}
                          {showDiscount && (
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#ef4444' }}>
                              {item.discount}
                            </td>
                          )}
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                            {item.final_price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <style>{`
                @media (min-width: 768px) {
                  .${uniqueId}-mobile {
                    display: none;
                  }
                  .${uniqueId}-desktop {
                    display: block !important;
                  }
                }
              `}</style>
            </>
          )
        }
      },
      QuoteContent: {
        ...baseConfig.components.QuoteContent,
        render: () => {
          return (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: quoteData?.quote?.content || '' }} />
            </div>
          )
        }
      },
      ...footerOverride
    }
  }
}
