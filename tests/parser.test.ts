import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser'

describe('Parser', () => {
  describe('Valid expressions', () => {
    it('should parse simple variable reference', () => {
      const result = parse('MY_VAR')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({
          type: 'var_ref',
          name: 'MY_VAR'
        })
      }
    })

    it('should parse variable with date addition', () => {
      const result = parse('MY_DATE + 2 days')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual({
          type: 'date_arithmetic',
          base: { type: 'var_ref', name: 'MY_DATE' },
          operator: '+',
          amount: 2,
          unit: 'days'
        })
      }
    })

    it('should parse variable with date subtraction', () => {
      const result = parse('SHIP_DATE - 7 days')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.type).toBe('date_arithmetic')
      }
    })

    it('should parse without spaces around operator', () => {
      const result = parse('MY_DATE+2days')
      expect(result.success).toBe(true)
    })

    it('should parse with extra spaces', () => {
      const result = parse('MY_DATE  +  2  days')
      expect(result.success).toBe(true)
    })

    it('should parse weeks', () => {
      const result = parse('DATE + 1 week')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toMatchObject({
          type: 'date_arithmetic',
          unit: 'week'
        })
      }
    })

    it('should parse months', () => {
      const result = parse('MY_DATE + 2 months')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toMatchObject({
          type: 'date_arithmetic',
          unit: 'months'
        })
      }
    })

    it('should parse years', () => {
      const result = parse('MY_DATE - 1 year')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toMatchObject({
          type: 'date_arithmetic',
          unit: 'year'
        })
      }
    })

    it('should parse chained operations', () => {
      const result = parse('MY_DATE + 1 month + 2 days')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value.type).toBe('date_arithmetic')
        const node = result.value as any
        expect(node.base.type).toBe('date_arithmetic')
      }
    })
  })

  describe('Invalid expressions', () => {
    it('should reject lowercase variable names', () => {
      const result = parse('my_date + 2 days')
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric interval', () => {
      const result = parse('MY_DATE + two days')
      expect(result.success).toBe(false)
    })

    it('should reject missing unit', () => {
      const result = parse('MY_DATE + 2')
      expect(result.success).toBe(false)
    })

    it('should reject invalid operator', () => {
      const result = parse('MY_DATE * 2 days')
      expect(result.success).toBe(false)
    })

    it('should reject invalid unit', () => {
      const result = parse('MY_DATE + 2 hours')
      expect(result.success).toBe(false)
    })

    it('should reject expression exceeding max length', () => {
      const longExpr = 'MY_VAR'.repeat(50)
      const result = parse(longExpr, { maxExpressionLength: 100 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe('EXPRESSION_TOO_LONG')
      }
    })

    it('should reject interval exceeding max amount', () => {
      const result = parse('MY_DATE + 20000 days', { maxIntervalAmount: 10000 })
      expect(result.success).toBe(false)
    })

    it('should reject zero interval', () => {
      const result = parse('MY_DATE + 0 days')
      expect(result.success).toBe(false)
    })

    it('should reject negative interval', () => {
      const result = parse('MY_DATE + -5 days')
      expect(result.success).toBe(false)
    })
  })
})
