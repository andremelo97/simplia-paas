import { BrandingData } from '../../services/branding'
import { createConfig } from './puck-config'

/**
 * Create Puck config with resolved quote data for preview
 * This overrides the quote components to render actual values instead of placeholders
 */
export const createConfigWithResolvedData = (branding: BrandingData, quoteData: any) => {
  const baseConfig = createConfig(branding)

  // Override quote components to render resolved values
  return {
    ...baseConfig,
    components: {
      ...baseConfig.components,
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
            xxxl: { label: '30px', number: '36px' },
          }

          const responsiveSizeStyles = {
            xs: { label: '14px', number: '16px' },
            s: { label: '16px', number: '18px' },
            m: { label: '18px', number: '20px' },
            l: { label: '20px', number: '24px' },
            xl: { label: '24px', number: '30px' },
            xxl: { label: '30px', number: '36px' },
            xxxl: { label: '36px', number: '42px' },
          }

          const sizeStyle = baseSizeStyles[size as keyof typeof baseSizeStyles]
          const responsiveStyle = responsiveSizeStyles[size as keyof typeof responsiveSizeStyles]
          const uniqueId = `quote-number-${Math.random().toString(36).substr(2, 9)}`

          return (
            <>
              <div className={uniqueId} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span className={`${uniqueId}-label`} style={{ fontSize: sizeStyle.label, fontWeight: '500', color: '#4b5563' }}>{label}</span>
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
        },
      },
      QuoteTotal: {
        ...baseConfig.components.QuoteTotal,
        render: ({ label, totalColor }: any) => {
          const resolveColor = (color: string) => {
            const colors: Record<string, string> = {
              primary: branding.primaryColor,
              secondary: branding.secondaryColor,
              accent: branding.accentColor,
              gray: '#6b7280',
              black: '#000000',
            }
            return colors[color] || branding.primaryColor
          }

          const totalColorResolved = resolveColor(totalColor)

          return (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>{label}:</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: totalColorResolved }}>
                {quoteData?.quote?.total || '$0.00'}
              </span>
            </div>
          )
        },
      },
      QuoteItems: {
        ...baseConfig.components.QuoteItems,
        render: ({ showPrice, showDiscount }: any) => {
          const uniqueId = `quote-items-${Math.random().toString(36).substr(2, 9)}`
          const items = quoteData?.items || []

          if (items.length === 0) {
            return (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                No items in this quote
              </div>
            )
          }

          return (
            <>
              {/* Mobile/Tablet: Card layout */}
              <div className={`${uniqueId}-mobile`} style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((item, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#ffffff',
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                          {item.description}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                        <div>
                          <span style={{ color: '#6b7280' }}>Qty:</span>
                          <span style={{ marginLeft: '8px', fontWeight: '600' }}>{item.quantity}</span>
                        </div>
                        {showPrice && (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#6b7280' }}>Price:</span>
                            <span style={{ marginLeft: '8px', fontWeight: '600' }}>{item.base_price}</span>
                          </div>
                        )}
                        {showDiscount && (
                          <>
                            <div>
                              <span style={{ color: '#6b7280' }}>Discount:</span>
                              <span style={{ marginLeft: '8px', fontWeight: '600', color: '#ef4444' }}>{item.discount}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: '#6b7280' }}>Total:</span>
                              <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>{item.final_price}</span>
                            </div>
                          </>
                        )}
                        {!showDiscount && (
                          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                            <span style={{ color: '#6b7280' }}>Total:</span>
                            <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>{item.final_price}</span>
                          </div>
                        )}
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
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Item</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Qty</th>
                        {showPrice && (
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Price</th>
                        )}
                        {showDiscount && (
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Discount</th>
                        )}
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
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
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#ef4444' }}>{item.discount}</td>
                          )}
                          <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>{item.final_price}</td>
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
        },
      },
      QuoteContent: {
        ...baseConfig.components.QuoteContent,
        render: () => {
          return (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: quoteData?.quote?.content || '' }} />
            </div>
          )
        },
      },
    },
  }
}
