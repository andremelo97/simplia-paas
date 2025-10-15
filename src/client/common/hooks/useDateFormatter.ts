/**
 * useDateFormatter Hook
 *
 * Provides timezone-aware date formatting functions that automatically use
 * the tenant timezone and locale from Auth Store.
 *
 * Works in TQ application by subscribing to the auth store.
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

import {
  formatShortDate as formatShortDateUtil,
  formatLongDate as formatLongDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
  formatRelativeTime as formatRelativeTimeUtil,
  formatMonthYear as formatMonthYearUtil,
  getNowInTimezone as getNowInTimezoneUtil
} from '@client/common/utils/dateTime'

// Static import - subscribe to TQ auth store reactively
import { useAuthStore as useTQAuthStore } from '@client/apps/tq/shared/store/auth'

/**
 * Date formatter hook for TQ application
 * Uses tenant timezone and locale from Auth Store
 */
export function useDateFormatter() {
  // Subscribe to TQ auth store (reactively) - updates when timezone/locale change
  const timezone = useTQAuthStore(state => state.tenantTimezone) || 'America/Sao_Paulo'
  const locale = useTQAuthStore(state => state.tenantLocale) || 'pt-BR'

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
