import React from 'react'
import { BrandingData } from '../../../services/branding'

export const createQuoteComponents = (branding: BrandingData) => ({
  QuoteNumber: {
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          <span className="font-bold text-gray-900">{'{{quote.number}}'}</span>
        </div>
      )
    },
  },
  QuoteTotal: {
    fields: {
      label: {
        type: 'text' as const,
      },
    },
    defaultProps: {
      label: 'Total',
    },
    render: ({ label }: any) => {
      return (
        <div className="flex items-center justify-between p-4 bg-gray-100 rounded">
          <span className="text-lg font-semibold">{label}:</span>
          <span
            className="text-2xl font-bold"
            style={{ color: branding.primaryColor }}
          >
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
      return (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Quantity</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                {showDiscount && (
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Discount</th>
                )}
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-3 text-sm">{'{{item.name}}'}</td>
                <td className="px-4 py-3 text-sm text-right">{'{{item.quantity}}'}</td>
                <td className="px-4 py-3 text-sm text-right">{'{{item.base_price}}'}</td>
                {showDiscount && (
                  <td className="px-4 py-3 text-sm text-right text-red-600">{'{{item.discount}}'}</td>
                )}
                <td className="px-4 py-3 text-sm text-right font-semibold">{'{{item.final_price}}'}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
