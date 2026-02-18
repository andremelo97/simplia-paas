import { Quote } from '../services/quotes'

export interface ResolvedDocumentData {
  document: {
    number: string
    total: string
    content: string
    status: string
    created_at: string
  }
  patient: {
    first_name: string
    last_name: string
    full_name: string
    email: string
    phone: string
  }
  items: Array<{
    name: string
    description: string
    quantity: number
    base_price: string
    discount: string
    final_price: string
  }>
}

export interface ResolveTemplateOptions {
  formatCurrency?: (value: number | string) => string
  formatDate?: (value: string | number | Date | null | undefined) => string
}

const defaultFormatCurrency = (amount: number | string): string => {
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  if (Number.isNaN(numericValue)) {
    return '$0.00'
  }
  return `$${numericValue.toFixed(2)}`
}

const defaultFormatDate = (date: string | number | Date | null | undefined): string => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * Resolve document data into structured format for preview rendering
 * Formats numbers, dates, and prepares data for Puck components
 */
export const resolveTemplateVariables = (
  _templateContent: any,
  quote: Quote,
  options: ResolveTemplateOptions = {}
): ResolvedDocumentData => {
  const formatCurrency = options.formatCurrency ?? defaultFormatCurrency
  const formatDate = options.formatDate ?? defaultFormatDate

  const documentData: ResolvedDocumentData = {
    document: {
      number: quote.number || '',
      total: formatCurrency(quote.total ?? 0),
      content: quote.content || '',
      status: quote.status || 'draft',
      created_at: formatDate(quote.created_at)
    },
    patient: {
      first_name: quote.patient_first_name || '',
      last_name: quote.patient_last_name || '',
      full_name: `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim() || 'N/A',
      email: quote.patient_email || '',
      phone: quote.patient_phone || ''
    },
    items: (quote.items || []).map(item => {
      const basePrice = toNumber((item as any).basePrice ?? (item as any).base_price)
      const discountAmount = toNumber((item as any).discountAmount ?? (item as any).discount_amount)
      const finalPrice = toNumber((item as any).finalPrice ?? (item as any).final_price)

      return {
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        base_price: formatCurrency(basePrice),
        discount: formatCurrency(discountAmount),
        final_price: formatCurrency(finalPrice)
      }
    })
  }

  return documentData
}
