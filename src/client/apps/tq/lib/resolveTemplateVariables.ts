import { Quote } from '../../services/quotes'

export interface ResolvedQuoteData {
  quote: {
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

/**
 * Resolve quote data into structured format for preview rendering
 * Formats numbers, dates, and prepares data for Puck components
 */
export const resolveTemplateVariables = (
  templateContent: any,
  quote: Quote
): ResolvedQuoteData => {
  const quoteData: ResolvedQuoteData = {
    quote: {
      number: quote.number || '',
      total: quote.total ? `$${parseFloat(quote.total).toFixed(2)}` : '$0.00',
      content: quote.content || '',
      status: quote.status || 'draft',
      created_at: quote.created_at ? new Date(quote.created_at).toLocaleDateString('pt-BR') : ''
    },
    patient: {
      first_name: quote.patient_first_name || '',
      last_name: quote.patient_last_name || '',
      full_name: `${quote.patient_first_name || ''} ${quote.patient_last_name || ''}`.trim() || 'N/A',
      email: quote.patient_email || '',
      phone: quote.patient_phone || ''
    },
    items: (quote.items || []).map(item => ({
      name: item.name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      base_price: item.basePrice ? `$${parseFloat(String(item.basePrice)).toFixed(2)}` : '$0.00',
      discount: item.discountAmount ? `$${parseFloat(String(item.discountAmount)).toFixed(2)}` : '$0.00',
      final_price: item.finalPrice ? `$${parseFloat(String(item.finalPrice)).toFixed(2)}` : '$0.00'
    }))
  }

  return quoteData
}
