/**
 * Date/Time Formatting Utilities
 *
 * Provides timezone-aware date formatting using Intl.DateTimeFormat API.
 * Uses tenant timezone and locale from Auth Store for consistent formatting.
 *
 * Usage:
 *   import { formatShortDate, formatLongDate, formatTime } from '@client/common/utils/dateTime'
 *
 *   formatShortDate('2025-01-10', 'America/Sao_Paulo', 'pt-BR')  // '10/01/2025'
 *   formatShortDate('2025-01-10', 'Australia/Gold_Coast', 'en-AU')  // '10/01/2025'
 */

/**
 * Format date in short format (DD/MM/YYYY for pt-BR/en-AU, MM/DD/YYYY for en-US)
 *
 * @param date - Date string, Date object, or timestamp
 * @param timezone - IANA timezone identifier (e.g., 'America/Sao_Paulo')
 * @param locale - Locale code (e.g., 'pt-BR', 'en-AU')
 * @returns Formatted date string
 */
export function formatShortDate(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: timezone
    }).format(dateObj)
  } catch (error) {
    console.warn('Failed to format date:', error)
    return '-'
  }
}

/**
 * Format date in long format (DD de MMM de YYYY for pt-BR, DD MMM YYYY for en-AU)
 *
 * @param date - Date string, Date object, or timestamp
 * @param timezone - IANA timezone identifier
 * @param locale - Locale code
 * @returns Formatted date string
 */
export function formatLongDate(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: timezone
    }).format(dateObj)
  } catch (error) {
    console.warn('Failed to format date:', error)
    return '-'
  }
}

/**
 * Format time in 24h format (HH:mm)
 *
 * @param date - Date string, Date object, or timestamp
 * @param timezone - IANA timezone identifier
 * @param locale - Locale code
 * @returns Formatted time string
 */
export function formatTime(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    }).format(dateObj)
  } catch (error) {
    console.warn('Failed to format time:', error)
    return '-'
  }
}

/**
 * Format date and time (DD/MM/YYYY HH:mm)
 *
 * @param date - Date string, Date object, or timestamp
 * @param timezone - IANA timezone identifier
 * @param locale - Locale code
 * @returns Formatted date-time string
 */
export function formatDateTime(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    }).format(dateObj)
  } catch (error) {
    console.warn('Failed to format date-time:', error)
    return '-'
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "há 2 horas")
 *
 * @param date - Date string, Date object, or timestamp
 * @param timezone - IANA timezone identifier
 * @param locale - Locale code
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (diffSec < 60) {
      return rtf.format(-diffSec, 'second')
    } else if (diffMin < 60) {
      return rtf.format(-diffMin, 'minute')
    } else if (diffHour < 24) {
      return rtf.format(-diffHour, 'hour')
    } else if (diffDay < 30) {
      return rtf.format(-diffDay, 'day')
    } else {
      // Fallback to short date for older dates
      return formatShortDate(dateObj, timezone, locale)
    }
  } catch (error) {
    console.warn('Failed to format relative time:', error)
    return '-'
  }
}

/**
 * Format month and year (MMM YYYY for en-AU, MMM de YYYY for pt-BR)
 *
 * @param date - Date string, Date object, or timestamp
 * @param timezone - IANA timezone identifier
 * @param locale - Locale code
 * @returns Formatted month-year string
 */
export function formatMonthYear(
  date: string | Date | number | null | undefined,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR'
): string {
  if (!date) return '-'

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
      timeZone: timezone
    }).format(dateObj)
  } catch (error) {
    console.warn('Failed to format month-year:', error)
    return '-'
  }
}

/**
 * Get current date in tenant timezone
 *
 * @param timezone - IANA timezone identifier
 * @returns Date object adjusted to tenant timezone
 */
export function getNowInTimezone(timezone: string = 'America/Sao_Paulo'): Date {
  try {
    // Get current date in UTC
    const now = new Date()

    // Format as ISO string in target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone
    })

    const parts = formatter.formatToParts(now)
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    const hour = parts.find(p => p.type === 'hour')?.value
    const minute = parts.find(p => p.type === 'minute')?.value
    const second = parts.find(p => p.type === 'second')?.value

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
  } catch (error) {
    console.warn('Failed to get date in timezone:', error)
    return new Date()
  }
}

/**
 * Convert Date object representing a moment in tenant timezone to ISO string
 *
 * IMPORTANT: This function receives a Date object from getNowInTimezone()
 * which already represents the correct date/time in the tenant's timezone.
 * We just need to convert it to ISO (UTC) format.
 *
 * Example:
 *   - NOW in Brazil: 2025-10-29 18:25:00 (BRT = UTC-3)
 *   - Add 1 day: 2025-10-30 18:25:00 (BRT)
 *   - Convert to UTC: 2025-10-30T21:25:00.000Z
 *
 * @param date - Date object from getNowInTimezone() or similar
 * @returns ISO string in UTC representing the same moment
 */
export function convertToDateISO(date: Date): string {
  // The Date object from getNowInTimezone() is already a Date object
  // We just return its ISO representation
  return date.toISOString()
}

/**
 * Get timezone offset in minutes for a specific timezone at a given date
 *
 * @param timezone - IANA timezone identifier
 * @param date - Date object to calculate offset for (handles DST)
 * @returns Offset in minutes (negative for timezones ahead of UTC)
 */
export function getTimezoneOffsetMinutes(
  timezone: string = 'America/Sao_Paulo',
  date: Date = new Date()
): number {
  try {
    // Get date string in UTC
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))

    // Get date string in target timezone
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))

    // Calculate difference in minutes
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60)
  } catch (error) {
    console.warn('Failed to get timezone offset:', error)
    return 0
  }
}

/**
 * Format date string (YYYY-MM-DD) to locale date string for display
 * This function does NOT perform timezone conversion - it just formats the date
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param locale - Locale code for formatting
 * @returns Formatted date string (e.g., "30/10/2025" for pt-BR)
 */
export function formatDateStringForDisplay(
  dateString: string,
  locale: string = 'pt-BR'
): string {
  if (!dateString) return '-'

  try {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  } catch (error) {
    console.warn('Failed to format date string for display:', error)
    return dateString
  }
}
