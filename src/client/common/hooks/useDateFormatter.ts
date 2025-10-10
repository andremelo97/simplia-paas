/**
 * useDateFormatter Hook
 *
 * Provides timezone-aware date formatting functions that automatically use
 * the tenant timezone and locale from Auth Store.
 *
 * Works across TQ and Hub applications by detecting the correct auth store.
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

/**
 * Date formatter hook for TQ and Hub applications
 * Uses tenant timezone and locale from Auth Store
 */
export function useDateFormatter() {
  let timezone: string | undefined
  let locale: string | undefined

  // Try to import from TQ auth store
  try {
    const { useAuthStore: useTQAuthStore } = require('@client/apps/tq/shared/store/auth')
    timezone = useTQAuthStore(state => state.tenantTimezone)
    locale = useTQAuthStore(state => state.tenantLocale)
  } catch (e) {
    // TQ store not available
  }

  // Try to import from Hub auth store if TQ didn't work
  if (!timezone || !locale) {
    try {
      const { useAuthStore: useHubAuthStore } = require('@client/apps/hub/store/auth')
      timezone = useHubAuthStore(state => state.tenantTimezone)
      locale = useHubAuthStore(state => state.tenantLocale)
    } catch (e) {
      // Hub store not available
    }
  }

  // Fallback to defaults
  if (!timezone) timezone = 'America/Sao_Paulo'
  if (!locale) locale = 'pt-BR'

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
