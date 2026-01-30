/**
 * Date Filter Utilities
 *
 * Converts local dates (YYYY-MM-DD) to UTC timestamps considering tenant timezone.
 * This ensures date filters work correctly regardless of the user's physical location.
 *
 * Example:
 * - User selects "30/01/2026" in date filter
 * - Tenant timezone is Australia/Brisbane (UTC+10)
 * - Start of day: 30/01 00:00 AEDT = 29/01 14:00 UTC
 * - End of day: 30/01 23:59 AEDT = 30/01 13:59 UTC
 */

import { useDateFormatter } from '../hooks/useDateFormatter'
import { useCallback, useMemo } from 'react'

/**
 * Converts a local date string (YYYY-MM-DD) to a UTC ISO timestamp
 * considering the specified timezone.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param timezone - IANA timezone string (e.g., "Australia/Brisbane")
 * @param boundary - 'start' for beginning of day (00:00:00.000), 'end' for end of day (23:59:59.999)
 * @returns ISO 8601 UTC timestamp string
 */
export function localDateToUtcTimestamp(
  date: string,
  timezone: string,
  boundary: 'start' | 'end'
): string {
  if (!date || !timezone) {
    throw new Error('Date and timezone are required')
  }

  // Parse the date parts
  const [year, month, day] = date.split('-').map(Number)

  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`)
  }

  // Create a date string with the desired time in the tenant's timezone
  // We use Intl.DateTimeFormat to find the UTC offset for this specific date
  const timeString = boundary === 'start' ? '00:00:00' : '23:59:59'

  // Create a temporary date to find the timezone offset
  // We construct a date in UTC first, then calculate what UTC time corresponds
  // to the desired local time in the tenant's timezone

  // Method: Use the formatting API to reverse-engineer the offset
  // Create a reference date at noon UTC on the desired day
  const referenceDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  // Format the date in the target timezone to get the local representation
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  // Get timezone offset by comparing UTC and local times
  // This is a more reliable method that handles DST correctly
  const localParts = formatter.formatToParts(referenceDate)
  const getPartValue = (type: string) =>
    localParts.find((p) => p.type === type)?.value || '0'

  const localHour = parseInt(getPartValue('hour'), 10)
  const utcHour = referenceDate.getUTCHours()

  // Calculate the rough offset (this handles most cases)
  // But we need a more precise method for edge cases

  // Better approach: Create the target date/time and use the timezone
  // by constructing a string that JavaScript can parse with timezone info

  // Create date string in ISO format with the target time
  const targetHours = boundary === 'start' ? 0 : 23
  const targetMinutes = boundary === 'start' ? 0 : 59
  const targetSeconds = boundary === 'start' ? 0 : 59
  const targetMs = boundary === 'start' ? 0 : 999

  // Use a different approach: iterate to find the correct UTC time
  // Start with a naive UTC date and adjust based on the offset
  const naiveUtc = new Date(
    Date.UTC(year, month - 1, day, targetHours, targetMinutes, targetSeconds, targetMs)
  )

  // Get what this UTC time would be in the target timezone
  const inTargetTz = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(naiveUtc)

  // Parse the formatted date to see how it differs
  const [datePart, timePart] = inTargetTz.split(', ')
  const [formattedYear, formattedMonth, formattedDay] = datePart.split('-').map(Number)
  const [formattedHour, formattedMinute] = timePart.split(':').map(Number)

  // Calculate the difference to find the offset
  // If the formatted day/hour differs from our target, adjust accordingly
  const targetDate = new Date(
    Date.UTC(year, month - 1, day, targetHours, targetMinutes, targetSeconds, targetMs)
  )

  // Calculate day difference
  const dayDiff =
    (formattedYear - year) * 365 +
    (formattedMonth - month) * 30 +
    (formattedDay - day)
  const hourDiff = formattedHour - targetHours + dayDiff * 24
  const minuteDiff = formattedMinute - targetMinutes

  // Adjust the UTC time by the inverse of the offset
  const offsetMs = (hourDiff * 60 + minuteDiff) * 60 * 1000
  const correctedUtc = new Date(targetDate.getTime() - offsetMs)

  return correctedUtc.toISOString()
}

/**
 * Simplified version using a more straightforward algorithm
 * that's more reliable across timezones and DST transitions
 */
export function localDateToUtcRange(
  date: string,
  timezone: string,
  boundary: 'start' | 'end'
): string {
  if (!date || !timezone) {
    throw new Error('Date and timezone are required')
  }

  // Parse the date
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`)
  }

  // Target time in the local timezone
  const targetHour = boundary === 'start' ? 0 : 23
  const targetMinute = boundary === 'start' ? 0 : 59
  const targetSecond = boundary === 'start' ? 0 : 59
  const targetMs = boundary === 'start' ? 0 : 999

  // Find the UTC time that corresponds to the target local time
  // by using binary search on the timestamp

  // Start with a rough estimate (assume UTC±12 max offset)
  const roughUtc = Date.UTC(year, month - 1, day, targetHour, targetMinute, targetSecond, targetMs)

  // Create formatter to check local time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // Function to get local date parts from UTC timestamp
  const getLocalParts = (utcMs: number) => {
    const parts = formatter.formatToParts(new Date(utcMs))
    const getValue = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10)
    return {
      year: getValue('year'),
      month: getValue('month'),
      day: getValue('day'),
      hour: getValue('hour'),
      minute: getValue('minute')
    }
  }

  // Search for the correct UTC timestamp
  // Max offset is ±14 hours, so search within ±15 hours of rough estimate
  const maxOffsetMs = 15 * 60 * 60 * 1000
  let low = roughUtc - maxOffsetMs
  let high = roughUtc + maxOffsetMs

  // Binary search to find the correct UTC time
  while (high - low > 60000) {
    // Within 1 minute precision
    const mid = Math.floor((low + high) / 2)
    const local = getLocalParts(mid)

    // Compare local time to target
    const localValue =
      local.year * 100000000 +
      local.month * 1000000 +
      local.day * 10000 +
      local.hour * 100 +
      local.minute
    const targetValue =
      year * 100000000 +
      month * 1000000 +
      day * 10000 +
      targetHour * 100 +
      targetMinute

    if (localValue < targetValue) {
      low = mid
    } else if (localValue > targetValue) {
      high = mid
    } else {
      // Found it! Adjust for seconds and ms
      const result = new Date(mid)
      result.setUTCSeconds(targetSecond)
      result.setUTCMilliseconds(targetMs)
      return result.toISOString()
    }
  }

  // Use the midpoint as our best estimate
  const result = new Date(Math.floor((low + high) / 2))
  result.setUTCSeconds(targetSecond)
  result.setUTCMilliseconds(targetMs)
  return result.toISOString()
}

/**
 * Hook for converting date filter values to UTC timestamps
 * Uses the tenant's timezone from the auth store
 */
export function useDateFilterParams() {
  const { getTimezone } = useDateFormatter()
  const timezone = getTimezone()

  const convertDateRange = useCallback(
    (from?: string, to?: string) => {
      return {
        created_from_utc: from ? localDateToUtcRange(from, timezone, 'start') : undefined,
        created_to_utc: to ? localDateToUtcRange(to, timezone, 'end') : undefined
      }
    },
    [timezone]
  )

  return useMemo(
    () => ({
      timezone,
      convertDateRange
    }),
    [timezone, convertDateRange]
  )
}
