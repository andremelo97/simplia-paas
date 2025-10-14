import i18next from 'i18next'

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export const QUOTE_STATUS_COLORS = {
  [QuoteStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [QuoteStatus.SENT]: 'bg-blue-100 text-blue-800',
  [QuoteStatus.APPROVED]: 'bg-green-100 text-green-800',
  [QuoteStatus.REJECTED]: 'bg-red-100 text-red-800',
  [QuoteStatus.EXPIRED]: 'bg-yellow-100 text-yellow-800'
}

export const getQuoteStatusLabel = (status: string): string => {
  // Try to get translated label from i18next
  const key = `tq:quotes.status.${status}`
  if (i18next.exists(key)) {
    return i18next.t(key)
  }
  // Fallback to status value
  return status
}

export function getQuoteStatusOptions() {
  return [
    { value: QuoteStatus.DRAFT, label: getQuoteStatusLabel(QuoteStatus.DRAFT) },
    { value: QuoteStatus.SENT, label: getQuoteStatusLabel(QuoteStatus.SENT) },
    { value: QuoteStatus.APPROVED, label: getQuoteStatusLabel(QuoteStatus.APPROVED) },
    { value: QuoteStatus.REJECTED, label: getQuoteStatusLabel(QuoteStatus.REJECTED) },
    { value: QuoteStatus.EXPIRED, label: getQuoteStatusLabel(QuoteStatus.EXPIRED) }
  ]
}

export const QUOTE_STATUS_OPTIONS = getQuoteStatusOptions()

export const getQuoteStatusColor = (status: string): string => {
  return QUOTE_STATUS_COLORS[status as QuoteStatus] || 'bg-gray-100 text-gray-800'
}
