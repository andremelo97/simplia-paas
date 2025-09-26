export enum SessionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export const SESSION_STATUS_LABELS = {
  [SessionStatus.DRAFT]: 'Draft',
  [SessionStatus.PENDING]: 'Pending',
  [SessionStatus.COMPLETED]: 'Completed',
  [SessionStatus.CANCELLED]: 'Cancelled'
} as const

export const SESSION_STATUS_COLORS = {
  [SessionStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [SessionStatus.PENDING]: 'bg-blue-100 text-blue-800',
  [SessionStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [SessionStatus.CANCELLED]: 'bg-red-100 text-red-800'
} as const

export const SESSION_STATUS_OPTIONS = [
  { value: SessionStatus.DRAFT, label: SESSION_STATUS_LABELS[SessionStatus.DRAFT] },
  { value: SessionStatus.PENDING, label: SESSION_STATUS_LABELS[SessionStatus.PENDING] },
  { value: SessionStatus.COMPLETED, label: SESSION_STATUS_LABELS[SessionStatus.COMPLETED] },
  { value: SessionStatus.CANCELLED, label: SESSION_STATUS_LABELS[SessionStatus.CANCELLED] }
] as const

export function getSessionStatusLabel(status: string): string {
  return SESSION_STATUS_LABELS[status as SessionStatus] || status
}

export function getSessionStatusColor(status: string): string {
  return SESSION_STATUS_COLORS[status as SessionStatus] || 'bg-gray-100 text-gray-800'
}