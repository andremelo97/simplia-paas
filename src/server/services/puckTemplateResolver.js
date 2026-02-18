/**
 * Puck Template Resolver Service
 *
 * Resolves quote data for Puck templates
 * MUST match EXACTLY the frontend logic from resolveTemplateVariables.ts
 * This ensures patient sees the EXACT same data as authenticated users
 */

function getLocaleConfig(locale = 'en-US') {
  const effectiveLocale = locale || 'en-US'
  const isBrazil = effectiveLocale === 'pt-BR'
  return {
    locale: effectiveLocale,
    currency: isBrazil ? 'BRL' : 'USD'
  }
}

function createCurrencyFormatter(locale = 'en-US') {
  const { currency } = getLocaleConfig(locale)
  return (value) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : Number(value)
    if (Number.isNaN(numericValue)) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(0)
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue)
  }
}

function createDateFormatter(locale = 'en-US') {
  return (date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }
}

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function resolveDocumentData(document, patient, items, options = {}) {
  const locale = options.locale || 'en-US'
  const formatCurrency = options.formatCurrency || createCurrencyFormatter(locale)
  const formatDate = options.formatDate || createDateFormatter(locale)

  // Build base document data (works for both quote and prevention)
  const result = {
    document: {
      number: document.number || '',
      total: formatCurrency(document.total ?? 0),
      content: document.content || '',
      status: document.status || 'draft',
      created_at: formatDate(document.created_at)
    },
    patient: {
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      full_name: `${(patient.first_name || '')} ${(patient.last_name || '')}`.trim() || 'N/A',
      email: patient.email || '',
      phone: patient.phone || ''
    },
    items: (items || []).map((item) => {
      const basePrice = toNumber(item.base_price ?? item.basePrice)
      const discountAmount = toNumber(item.discount_amount ?? item.discountAmount)
      const finalPrice = toNumber(item.final_price ?? item.finalPrice)

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

  return result
}

// Alias for backwards compatibility
function resolveQuoteData(quote, patient, items, options = {}) {
  return resolveDocumentData(quote, patient, items, options)
}

function createContentPackage(templateContent, document, patient, items, options = {}) {
  const resolvedData = resolveDocumentData(document, patient, items, options)

  return {
    template: templateContent || { content: [], root: {} },
    resolvedData
  }
}

module.exports = {
  createContentPackage,
  resolveQuoteData,
  resolveDocumentData,
  createCurrencyFormatter,
  createDateFormatter
}

