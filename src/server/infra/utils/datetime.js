/**
 * Date/Time utilities for pricing system
 * 
 * Conventions:
 * - All intervals use [start, end) semantics (inclusive start, exclusive end)
 * - Null end dates represent infinity (+∞)
 * - All timestamps normalized to UTC with second precision
 */

/**
 * JavaScript's max safe date for representing infinity
 * @type {Date}
 */
const INFINITY_DATE = new Date(8640000000000000);

/**
 * Check if two time intervals overlap
 * Uses [start, end) semantics where end is exclusive
 * 
 * @param {Date} aFrom - Start of interval A (inclusive)
 * @param {Date|null} aTo - End of interval A (exclusive, null = infinity)  
 * @param {Date} bFrom - Start of interval B (inclusive)
 * @param {Date|null} bTo - End of interval B (exclusive, null = infinity)
 * @returns {boolean} True if intervals overlap
 * 
 * @example
 * // Adjacent intervals (no overlap)
 * overlaps(new Date('2025-01-01'), new Date('2025-01-02'), 
 *          new Date('2025-01-02'), new Date('2025-01-03')) // false
 * 
 * // Overlapping intervals
 * overlaps(new Date('2025-01-01'), new Date('2025-01-03'),
 *          new Date('2025-01-02'), new Date('2025-01-04')) // true
 * 
 * // Open-ended interval
 * overlaps(new Date('2025-01-01'), null,
 *          new Date('2025-01-02'), new Date('2025-01-04')) // true
 */
function overlaps(aFrom, aTo, bFrom, bTo) {
  // Convert null to infinity for comparison
  const aEnd = aTo ?? INFINITY_DATE;
  const bEnd = bTo ?? INFINITY_DATE;
  
  // Intervals [aFrom, aEnd) and [bFrom, bEnd) overlap if:
  // aFrom < bEnd && bFrom < aEnd
  return aFrom < bEnd && bFrom < aEnd;
}

/**
 * Normalize date to UTC with second precision
 * Truncates milliseconds for consistent comparisons
 * 
 * @param {Date|string} date - Date to normalize
 * @returns {Date} Normalized date in UTC with second precision
 */
function normalizeToUTCSeconds(date) {
  const d = new Date(date);
  d.setUTCMilliseconds(0);
  return d;
}

/**
 * Format date range for display
 * 
 * @param {Date} from - Start date
 * @param {Date|null} to - End date (null = open-ended)
 * @returns {string} Formatted range string
 */
function formatDateRange(from, to) {
  const fromStr = from.toISOString();
  const toStr = to ? to.toISOString() : 'open-ended';
  return `[${fromStr}, ${toStr})`;
}

/**
 * Check if a date is effectively infinity (representing open-ended periods)
 * 
 * @param {Date|null} date - Date to check
 * @returns {boolean} True if date represents infinity
 */
function isInfinity(date) {
  return date === null || date >= INFINITY_DATE;
}

module.exports = {
  overlaps,
  normalizeToUTCSeconds,
  formatDateRange,
  isInfinity,
  INFINITY_DATE
};