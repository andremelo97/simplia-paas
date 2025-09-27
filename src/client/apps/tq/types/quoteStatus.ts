export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export const QUOTE_STATUS_OPTIONS = [
  { value: QuoteStatus.DRAFT, label: 'Draft' },
  { value: QuoteStatus.SENT, label: 'Sent' },
  { value: QuoteStatus.APPROVED, label: 'Approved' },
  { value: QuoteStatus.REJECTED, label: 'Rejected' },
  { value: QuoteStatus.EXPIRED, label: 'Expired' }
]

export const QUOTE_STATUS_COLORS = {
  [QuoteStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [QuoteStatus.SENT]: 'bg-blue-100 text-blue-800',
  [QuoteStatus.APPROVED]: 'bg-green-100 text-green-800',
  [QuoteStatus.REJECTED]: 'bg-red-100 text-red-800',
  [QuoteStatus.EXPIRED]: 'bg-yellow-100 text-yellow-800'
}

export const getQuoteStatusLabel = (status: string): string => {
  const option = QUOTE_STATUS_OPTIONS.find(opt => opt.value === status)
  return option ? option.label : status
}

export const getQuoteStatusColor = (status: string): string => {
  return QUOTE_STATUS_COLORS[status as QuoteStatus] || 'bg-gray-100 text-gray-800'
}