import React from 'react'
import { BrandingData } from '../../../services/branding'
import { textColorOptions, resolveColor } from './color-options'

export const createQuoteComponents = (branding: BrandingData) => ({
  QuoteNumber: {
    label: 'Quote Number',
    fields: {
      label: {
        type: 'text' as const,
      },
    },
    defaultProps: {
      label: 'Quote #',
    },
    render: ({ label }: any) => {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>{label}</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{'{{quote.number}}'}</span>
        </div>
      )
    },
  },
  QuoteTotal: {
    fields: {
      label: {
        type: 'text' as const,
      },
      totalColor: {
        type: 'select' as const,
        label: 'Total Color',
        options: textColorOptions,
      },
    },
    defaultProps: {
      label: 'Total',
      totalColor: 'primary',
    },
    render: ({ label, totalColor }: any) => {
      const totalColorResolved = resolveColor(totalColor, branding)

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
            {'{{quote.total}}'}
          </span>
        </div>
      )
    },
  },
  QuoteItems: {
    fields: {
      showDiscount: {
        type: 'radio' as const,
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
    },
    defaultProps: {
      showDiscount: true,
    },
    render: ({ showDiscount }: any) => {
      const uniqueId = `quote-items-${Math.random().toString(36).substr(2, 9)}`

      return (
        <>
          {/* Mobile/Tablet: Card layout */}
          <div className={`${uniqueId}-mobile`} style={{ width: '100%' }}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
            }}>
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
                  <span style={{ color: '#6b7280' }}>Qty:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '600' }}>{'{{item.quantity}}'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#6b7280' }}>Price:</span>
                  <span style={{ marginLeft: '8px', fontWeight: '600' }}>{'{{item.base_price}}'}</span>
                </div>
                {showDiscount && (
                  <>
                    <div>
                      <span style={{ color: '#6b7280' }}>Discount:</span>
                      <span style={{ marginLeft: '8px', fontWeight: '600', color: '#ef4444' }}>{'{{item.discount}}'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#6b7280' }}>Total:</span>
                      <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>{'{{item.final_price}}'}</span>
                    </div>
                  </>
                )}
                {!showDiscount && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                    <span style={{ color: '#6b7280' }}>Total:</span>
                    <span style={{ marginLeft: '8px', fontWeight: '700', fontSize: '16px', color: '#111827' }}>{'{{item.final_price}}'}</span>
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
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Item</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Qty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Price</th>
                    {showDiscount && (
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Discount</th>
                    )}
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{'{{item.name}}'}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{'{{item.description}}'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{'{{item.quantity}}'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{'{{item.base_price}}'}</td>
                    {showDiscount && (
                      <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#ef4444' }}>{'{{item.discount}}'}</td>
                    )}
                    <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: '600' }}>{'{{item.final_price}}'}</td>
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
    },
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
    },
  },
})
