import { TimeUnit } from './types'

/**
 * Parse a string into a Date object.
 * Supports YYYY-MM-DD and ISO datetime formats.
 * 
 * Validates that parsed date matches input to catch invalid dates
 * like 2026-02-30 which JavaScript would silently convert to 2026-03-02.
 * 
 * @param value - Date string to parse
 * @returns Date object in UTC, or null if invalid
 * 
 * @example
 * parseDate('2026-02-16') // Valid
 * parseDate('2026-02-30') // null (invalid day)
 * parseDate('2026-02-16T14:30:00Z') // Valid (extracts date part)
 */
export function parseDate(value: string): Date | null {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T/
  
  // Handle YYYY-MM-DD format with validation
  if (isoDateRegex.test(value)) {
    const date = new Date(value + 'T00:00:00.000Z')
    if (!isNaN(date.getTime())) {
      // Validate by round-tripping: ensure parsed date matches input
      // This catches invalid dates like 2026-02-30
      const formatted = formatDate(date)
      if (formatted === value) {
        return date
      }
    }
  }
  
  // Handle ISO datetime format (extract date part)
  if (isoDateTimeRegex.test(value)) {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  return null
}

/**
 * Format a Date object as YYYY-MM-DD string.
 * Uses UTC to avoid timezone issues.
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 * 
 * @example
 * formatDate(new Date('2026-02-16T00:00:00Z')) // "2026-02-16"
 */
export function formatDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Add or subtract a time interval from a date.
 * Implements calendar-based arithmetic with month-end clamping.
 * 
 * Month/Year arithmetic rules:
 * - If target month doesn't have the original day, clamp to last day of month
 * - Example: 2026-01-31 + 1 month → 2026-02-28 (not March 3rd)
 * - Example: 2024-02-29 + 1 year → 2025-02-28 (leap year handling)
 * 
 * @param date - Base date
 * @param amount - Positive integer amount
 * @param unit - Time unit (day, week, month, year)
 * @param operator - '+' for addition, '-' for subtraction
 * @returns New Date object with arithmetic applied
 * 
 * @example
 * addToDate(new Date('2026-02-16'), 2, 'days', '+') // 2026-02-18
 * addToDate(new Date('2026-01-31'), 1, 'month', '+') // 2026-02-28 (clamped)
 */
export function addToDate(date: Date, amount: number, unit: TimeUnit, operator: '+' | '-'): Date {
  const result = new Date(date)
  const multiplier = operator === '+' ? 1 : -1
  const actualAmount = amount * multiplier

  switch (unit) {
    case 'day':
    case 'days':
      // Simple day arithmetic
      result.setUTCDate(result.getUTCDate() + actualAmount)
      break

    case 'week':
    case 'weeks':
      // Week = 7 days
      result.setUTCDate(result.getUTCDate() + actualAmount * 7)
      break

    case 'month':
    case 'months':
      // Month arithmetic with day clamping
      const originalDay = result.getUTCDate()
      result.setUTCMonth(result.getUTCMonth() + actualAmount)
      
      // If day changed (e.g., Jan 31 → Feb 31 became Mar 3), clamp to month end
      if (result.getUTCDate() !== originalDay) {
        result.setUTCDate(0)  // Set to last day of previous month
      }
      break

    case 'year':
    case 'years':
      // Year arithmetic with day clamping (for leap years)
      const originalDayYear = result.getUTCDate()
      result.setUTCFullYear(result.getUTCFullYear() + actualAmount)
      
      // If day changed (e.g., Feb 29 → Feb 29 non-leap year), clamp to month end
      if (result.getUTCDate() !== originalDayYear) {
        result.setUTCDate(0)  // Set to last day of previous month
      }
      break
  }

  return result
}

/**
 * Get current date as LocalDate (no time component).
 * Uses UTC to ensure timezone-consistent behavior.
 * 
 * @returns Current date at midnight UTC
 * 
 * @example
 * getCurrentDate() // 2026-02-16T00:00:00.000Z
 */
export function getCurrentDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}
