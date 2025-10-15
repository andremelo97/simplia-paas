import React from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor } from './color-options'

const withFallback = (value: string | undefined, fallback: string) =>
  (typeof value === 'string' && value.trim().length > 0) ? value : fallback

export const createQuoteComponents = (branding: BrandingData) => ({
  QuoteNumber: {
    fields: {
      label: {
        type: 'text' as const
      },
      size: {
        type: 'select' as const,
        label: 'Size',
        options: [
          { label: 'XXXL', value: 'xxxl' },
          { label: 'XXL', value: 'xxl' },
          { label: 'XL', value: 'xl' },
          { label: 'L', value: 'l' },
          { label: 'M', value: 'm' },
          { label: 'S', value: 's' },
          { label: 'XS', value: 'xs' }
        ]
      }
    },
    defaultProps: {
      label: 'Quote #',
      size: 'm'
    },
    render: ({ label, size }: any) => {
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
      const effectiveLabel = withFallback(label, 'Quote #')

      return (
        <>
          <div className={uniqueId} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span className={`${uniqueId}-label`} style={{ fontSize: sizeStyle.label, fontWeight: '500', color: '#4b5563' }}>
              {effectiveLabel}
            </span>
            <span className={`${uniqueId}-number`} style={{ fontSize: sizeStyle.number, fontWeight: '700', color: '#111827' }}>
              {'{{quote.number}}'}
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
    fields: {
      label: {
        type: 'text' as const
      },
      totalColor: {
        type: 'select' as const,
        label: 'Total Color',
        options: textColorOptions
      }
    },
    defaultProps: {
      label: 'Total',
      totalColor: 'primary'
    },
    render: ({ label, totalColor }: any) => {
      const totalColorResolved = resolveColor(totalColor, branding)
      const effectiveLabel = withFallback(label, 'Total')

      return (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '600' }}>{effectiveLabel}:</span>
          <span style={{ fontSize: '24px', fontWeight: '700', color: totalColorResolved }}>
            {'{{quote.total}}'}
          </span>
        </div>
      )
    }
  },
  QuoteItems: {
    fields: {
      showPrice: {
        type: 'radio' as const,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      showDiscount: {
        type: 'radio' as const,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      itemLabel: {
        type: 'text' as const,
        label: 'Item Label'
      },
      quantityLabel: {
        type: 'text' as const,
        label: 'Quantity Label'
      },
      priceLabel: {
        type: 'text' as const,
        label: 'Price Label'
      },
      discountLabel: {
        type: 'text' as const,
        label: 'Discount Label'
      },
      totalLabel: {
        type: 'text' as const,
        label: 'Total Label'
      }
    },
    defaultProps: {
      showPrice: true,
      showDiscount: true,
      itemLabel: 'Item',
      quantityLabel: 'Qty',
      priceLabel: 'Price',
      discountLabel: 'Discount',
      totalLabel: 'Total'
    },
    render: ({
      showPrice,
      showDiscount,
      itemLabel,
      quantityLabel,
      priceLabel,
      discountLabel,
      totalLabel
    }: any) => {
      const uniqueId = `quote-items-${Math.random().toString(36).substr(2, 9)}`

      const effectiveItemLabel = withFallback(itemLabel, 'Item')
      const effectiveQuantityLabel = withFallback(quantityLabel, 'Qty')
      const effectivePriceLabel = withFallback(priceLabel, 'Price')
      const effectiveDiscountLabel = withFallback(discountLabel, 'Discount')
      const effectiveTotalLabel = withFallback(totalLabel, 'Total')

      return (
        <>
          {/* Mobile/Tablet: Card layout */}
          <div className={`${uniqueId}-mobile`} style={{ width: '100%' }}>
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#ffffff'
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                  {'{{item.name}}'}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  {'{{item.description}}'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>{effectiveQuantityLabel}:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '600' }}>{'{{item.quantity}}'}</span>
                </div>
                {showPrice && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#6b7280' }}>{effectivePriceLabel}:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '600' }}>{'{{item.base_price}}'}</span>
                  </div>
                )}
                {showDiscount && (
                  <>
                    <div>
                      <span style={{ color: '#6b7280' }}>{effectiveDiscountLabel}:</span>
                      <span style={{ marginLeft: '8px', fontWeight: '600', color: '#ef4444' }}>{'{{item.discount}}'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#6b7280' }}>{effectiveTotalLabel}:</span>
                      <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>
                        {'{{item.final_price}}'}
                      </span>
                    </div>
                  </>
                )}
                {!showDiscount && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                    <span style={{ color: '#6b7280' }}>{effectiveTotalLabel}:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>
                      {'{{item.final_price}}'}
                    </span>
                  </div>
                )}
              </div>
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
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{'{{item.name}}'}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{'{{item.description}}'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{'{{item.quantity}}'}</td>
                    {showPrice && (
                      <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{'{{item.base_price}}'}</td>
                    )}
                    {showDiscount && (
                      <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#ef4444' }}>
                        {'{{item.discount}}'}
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>
                      {'{{item.final_price}}'}
                    </td>
                  </tr>
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
    fields: {
      // No configuration needed
    },
    render: () => {
      return (
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: '{{quote.content}}' }} />
        </div>
      )
    }
  }
})
