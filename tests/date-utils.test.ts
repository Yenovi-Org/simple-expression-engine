import { describe, it, expect } from 'vitest'
import { parseDate, formatDate, addToDate } from '../src/date-utils'

describe('Date Utils', () => {
  describe('parseDate', () => {
    it('should parse YYYY-MM-DD format', () => {
      const date = parseDate('2026-02-16')
      expect(date).not.toBeNull()
      expect(date?.getUTCFullYear()).toBe(2026)
      expect(date?.getUTCMonth()).toBe(1)
      expect(date?.getUTCDate()).toBe(16)
    })

    it('should parse ISO datetime and extract date', () => {
      const date = parseDate('2026-02-16T14:30:00Z')
      expect(date).not.toBeNull()
      expect(date?.getUTCFullYear()).toBe(2026)
    })

    it('should return null for invalid date', () => {
      expect(parseDate('invalid')).toBeNull()
      expect(parseDate('2026-13-01')).toBeNull()
      expect(parseDate('2026-02-30')).toBeNull()
    })
  })

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      expect(formatDate(date)).toBe('2026-02-16')
    })

    it('should pad single-digit months and days', () => {
      const date = new Date('2026-03-05T00:00:00Z')
      expect(formatDate(date)).toBe('2026-03-05')
    })
  })

  describe('addToDate - days', () => {
    it('should add days', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      const result = addToDate(date, 2, 'days', '+')
      expect(formatDate(result)).toBe('2026-02-18')
    })

    it('should subtract days', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      const result = addToDate(date, 7, 'days', '-')
      expect(formatDate(result)).toBe('2026-02-09')
    })

    it('should handle month boundaries', () => {
      const date = new Date('2026-02-28T00:00:00Z')
      const result = addToDate(date, 1, 'day', '+')
      expect(formatDate(result)).toBe('2026-03-01')
    })
  })

  describe('addToDate - weeks', () => {
    it('should add weeks (7 days)', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      const result = addToDate(date, 1, 'week', '+')
      expect(formatDate(result)).toBe('2026-02-23')
    })

    it('should subtract weeks', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      const result = addToDate(date, 2, 'weeks', '-')
      expect(formatDate(result)).toBe('2026-02-02')
    })
  })

  describe('addToDate - months', () => {
    it('should add months', () => {
      const date = new Date('2026-01-15T00:00:00Z')
      const result = addToDate(date, 1, 'month', '+')
      expect(formatDate(result)).toBe('2026-02-15')
    })

    it('should subtract months', () => {
      const date = new Date('2026-03-15T00:00:00Z')
      const result = addToDate(date, 1, 'month', '-')
      expect(formatDate(result)).toBe('2026-02-15')
    })

    it('should clamp to last day of month when day does not exist', () => {
      const date = new Date('2026-01-31T00:00:00Z')
      const result = addToDate(date, 1, 'month', '+')
      expect(formatDate(result)).toBe('2026-02-28')
    })

    it('should handle leap year month-end clamping', () => {
      const date = new Date('2024-01-31T00:00:00Z')
      const result = addToDate(date, 1, 'month', '+')
      expect(formatDate(result)).toBe('2024-02-29')
    })

    it('should handle multiple month additions with clamping', () => {
      const date = new Date('2026-01-31T00:00:00Z')
      const result = addToDate(date, 3, 'months', '+')
      expect(formatDate(result)).toBe('2026-04-30')
    })
  })

  describe('addToDate - years', () => {
    it('should add years', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      const result = addToDate(date, 1, 'year', '+')
      expect(formatDate(result)).toBe('2027-02-16')
    })

    it('should subtract years', () => {
      const date = new Date('2026-02-16T00:00:00Z')
      const result = addToDate(date, 2, 'years', '-')
      expect(formatDate(result)).toBe('2024-02-16')
    })

    it('should handle leap year to non-leap year', () => {
      const date = new Date('2024-02-29T00:00:00Z')
      const result = addToDate(date, 1, 'year', '+')
      expect(formatDate(result)).toBe('2025-02-28')
    })
  })
})
