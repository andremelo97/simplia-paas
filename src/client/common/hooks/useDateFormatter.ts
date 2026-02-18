/**
 * useDateFormatter Hook
 *
 * Provides timezone-aware date formatting functions that automatically use
 * the tenant timezone and locale from the shared auth storage.
 *
 * Works in both Hub and TQ applications by reading from the shared
 * 'auth-storage' localStorage key (used by both app auth stores).
 *
 * Usage in any component:
 *   import { useDateFormatter } from '@client/common/hooks/useDateFormatter'
 *
 *   const Component = () => {
 *     const { formatShortDate, formatDateTime } = useDateFormatter()
 *
 *     return <div>{formatShortDate(session.createdAt)}</div>
 *   }
 *
 * The hook returns formatters that automatically use the correct timezone/locale.
 */

import { useState } from 'react'
import {
  formatShortDate as formatShortDateUtil,
  formatLongDate as formatLongDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
  formatRelativeTime as formatRelativeTimeUtil,
  formatMonthYear as formatMonthYearUtil,
  getNowInTimezone as getNowInTimezoneUtil
} from '@client/common/utils/dateTime'

/** Read timezone/locale from the shared auth-storage (written by both Hub and TQ stores) */
function readAuthConfig(): { timezone: string; locale: string } {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      const state = parsed.state || parsed
      return {
        timezone: state.tenantTimezone || 'America/Sao_Paulo',
        locale: state.tenantLocale || 'pt-BR'
      }
    }
  } catch {
    // Fallback to defaults
  }
  return { timezone: 'America/Sao_Paulo', locale: 'pt-BR' }
}

/**
 * Date formatter hook — works in any app (Hub, TQ)
 * Reads tenant timezone and locale from shared auth storage
 */
export function useDateFormatter() {
  // Read once on mount — timezone/locale are stable per session (set at login)
  const [{ timezone, locale }] = useState(readAuthConfig)

  return {
    /**
     * Format date in short format (DD/MM/YYYY)
     */
    formatShortDate: (date: string | Date | number | null | undefined) =>
      formatShortDateUtil(date, timezone, locale),

    /**
     * Format date in long format (DD de MMM de YYYY)
     */
    formatLongDate: (date: string | Date | number | null | undefined) =>
      formatLongDateUtil(date, timezone, locale),

    /**
     * Format time in 24h format (HH:mm)
     */
    formatTime: (date: string | Date | number | null | undefined) =>
      formatTimeUtil(date, timezone, locale),

    /**
     * Format date and time (DD/MM/YYYY HH:mm)
     */
    formatDateTime: (date: string | Date | number | null | undefined) =>
      formatDateTimeUtil(date, timezone, locale),

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime: (date: string | Date | number | null | undefined) =>
      formatRelativeTimeUtil(date, timezone, locale),

    /**
     * Format month and year (MMM YYYY)
     */
    formatMonthYear: (date: string | Date | number | null | undefined) =>
      formatMonthYearUtil(date, timezone, locale),

    /**
     * Get current date in tenant timezone
     */
    getNowInTimezone: () => getNowInTimezoneUtil(timezone),

    /**
     * Get current timezone
     */
    getTimezone: () => timezone,

    /**
     * Get current locale
     */
    getLocale: () => locale
  }
}
