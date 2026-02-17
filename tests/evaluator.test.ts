import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser'
import { evaluate } from '../src/evaluator'

describe('Evaluator', () => {
  describe('Variable resolution', () => {
    it('should resolve user-provided date variable', () => {
      const parseResult = parse('SHIP_DATE')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { SHIP_DATE: '2026-02-16' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2026-02-16')
        }
      }
    })

    it('should resolve DATE system variable', () => {
      const parseResult = parse('DATE')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, {})
        expect(evalResult.success).toBe(true)
      }
    })

    it('should prioritize user variable over system variable', () => {
      const parseResult = parse('DATE')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { DATE: '2025-01-01' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2025-01-01')
        }
      }
    })

    it('should return error for undefined variable', () => {
      const parseResult = parse('UNDEFINED_VAR')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, {})
        expect(evalResult.success).toBe(false)
        if (!evalResult.success) {
          expect(evalResult.error.code).toBe('UNDEFINED_VARIABLE')
        }
      }
    })
  })

  describe('Date arithmetic', () => {
    it('should add days to date', () => {
      const parseResult = parse('SHIP_DATE + 2 days')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { SHIP_DATE: '2026-02-16' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2026-02-18')
        }
      }
    })

    it('should subtract days from date', () => {
      const parseResult = parse('SHIP_DATE - 7 days')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { SHIP_DATE: '2026-02-16' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2026-02-09')
        }
      }
    })

    it('should add weeks', () => {
      const parseResult = parse('DATE + 1 week')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { DATE: '2026-02-16' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2026-02-23')
        }
      }
    })

    it('should add months with day clamping', () => {
      const parseResult = parse('MY_DATE + 1 month')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { MY_DATE: '2026-01-31' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2026-02-28')
        }
      }
    })

    it('should add years with leap year handling', () => {
      const parseResult = parse('MY_DATE + 1 year')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { MY_DATE: '2024-02-29' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2025-02-28')
        }
      }
    })

    it('should handle chained operations', () => {
      const parseResult = parse('MY_DATE + 1 month + 2 days')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { MY_DATE: '2026-01-15' })
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2026-02-17')
        }
      }
    })

    it('should return error when performing arithmetic on non-date', () => {
      const parseResult = parse('MY_VAR + 2 days')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const evalResult = evaluate(parseResult.value, { MY_VAR: 'not a date' })
        expect(evalResult.success).toBe(false)
        if (!evalResult.success) {
          expect(evalResult.error.code).toBe('TYPE_ERROR')
        }
      }
    })
  })

  describe('Custom system variables', () => {
    it('should use custom DATE function', () => {
      const parseResult = parse('DATE')
      expect(parseResult.success).toBe(true)
      
      if (parseResult.success) {
        const customDate = new Date('2025-12-25T00:00:00Z')
        const evalResult = evaluate(
          parseResult.value,
          {},
          { DATE: () => customDate }
        )
        expect(evalResult.success).toBe(true)
        if (evalResult.success) {
          expect(evalResult.value).toBe('2025-12-25')
        }
      }
    })
  })
})
