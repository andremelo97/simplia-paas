import i18next from 'i18next'

export enum SessionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export const SESSION_STATUS_COLORS = {
  [SessionStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [SessionStatus.PENDING]: 'bg-blue-100 text-blue-800',
  [SessionStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [SessionStatus.CANCELLED]: 'bg-red-100 text-red-800'
} as const

export function getSessionStatusLabel(status: string): string {
  // Try to get translated label from i18next
  const key = `tq:sessions.status.${status}`
  if (i18next.exists(key)) {
    return i18next.t(key)
  }
  // Fallback to status value
  return status
}

export function getSessionStatusOptions() {
  return [
    { value: SessionStatus.DRAFT, label: getSessionStatusLabel(SessionStatus.DRAFT) },
    { value: SessionStatus.PENDING, label: getSessionStatusLabel(SessionStatus.PENDING) },
    { value: SessionStatus.COMPLETED, label: getSessionStatusLabel(SessionStatus.COMPLETED) },
    { value: SessionStatus.CANCELLED, label: getSessionStatusLabel(SessionStatus.CANCELLED) }
  ]
}

export const SESSION_STATUS_OPTIONS = getSessionStatusOptions()

export function getSessionStatusColor(status: string): string {
  return SESSION_STATUS_COLORS[status as SessionStatus] || 'bg-gray-100 text-gray-800'
}
