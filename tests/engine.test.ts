import { describe, it, expect } from 'vitest'
import { ExpressionEngine } from '../src/engine'

describe('ExpressionEngine', () => {
  describe('processText', () => {
    it('should replace simple variable', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('Hello {{NAME}}', { NAME: 'World' })
      expect(result.text).toBe('Hello World')
      expect(result.errors).toHaveLength(0)
    })

    it('should replace date arithmetic expression', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText(
        'Ship date: {{SHIP_DATE + 2 days}}',
        { SHIP_DATE: '2026-02-16' }
      )
      expect(result.text).toBe('Ship date: 2026-02-18')
      expect(result.errors).toHaveLength(0)
    })

    it('should handle multiple expressions', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText(
        'From {{START}} to {{END + 1 week}}',
        { START: '2026-02-16', END: '2026-02-16' }
      )
      expect(result.text).toBe('From 2026-02-16 to 2026-02-23')
      expect(result.errors).toHaveLength(0)
    })

    it('should handle expressions with extra spaces', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText(
        '{{ MY_DATE + 2 days }}',
        { MY_DATE: '2026-02-16' }
      )
      expect(result.text).toBe('2026-02-18')
      expect(result.errors).toHaveLength(0)
    })

    it('should leave invalid expressions unchanged and collect errors', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText(
        'Date: {{MY_DATE + invalid}}',
        { MY_DATE: '2026-02-16' }
      )
      expect(result.text).toBe('Date: {{MY_DATE + invalid}}')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('PARSE_ERROR')
    })

    it('should leave undefined variables unchanged and collect errors', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('Value: {{UNDEFINED}}', {})
      expect(result.text).toBe('Value: {{UNDEFINED}}')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('UNDEFINED_VARIABLE')
    })

    it('should handle mixed valid and invalid expressions', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText(
        '{{VALID}} and {{INVALID}}',
        { VALID: '2026-02-16' }
      )
      expect(result.text).toBe('2026-02-16 and {{INVALID}}')
      expect(result.errors).toHaveLength(1)
    })

    it('should use system DATE variable', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('Today: {{DATE}}', {})
      expect(result.text).toMatch(/Today: \d{4}-\d{2}-\d{2}/)
      expect(result.errors).toHaveLength(0)
    })

    it('should prioritize user variable over system variable', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('Date: {{DATE}}', { DATE: '2025-01-01' })
      expect(result.text).toBe('Date: 2025-01-01')
      expect(result.errors).toHaveLength(0)
    })

    it('should preserve text without expressions', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('No expressions here', {})
      expect(result.text).toBe('No expressions here')
      expect(result.errors).toHaveLength(0)
    })

    it('should handle empty text', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('', {})
      expect(result.text).toBe('')
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('extractExpressions', () => {
    it('should extract all expressions from text', () => {
      const engine = new ExpressionEngine()
      const expressions = engine.extractExpressions('{{A}} and {{B + 1 day}}')
      expect(expressions).toEqual(['{{A}}', '{{B + 1 day}}'])
    })

    it('should return empty array for text without expressions', () => {
      const engine = new ExpressionEngine()
      const expressions = engine.extractExpressions('No expressions')
      expect(expressions).toEqual([])
    })
  })

  describe('validateExpression', () => {
    it('should validate correct expression', () => {
      const engine = new ExpressionEngine()
      const result = engine.validateExpression('{{MY_DATE + 2 days}}')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should invalidate incorrect expression', () => {
      const engine = new ExpressionEngine()
      const result = engine.validateExpression('{{my_date + 2 days}}')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate simple variable', () => {
      const engine = new ExpressionEngine()
      const result = engine.validateExpression('{{MY_VAR}}')
      expect(result.valid).toBe(true)
    })
  })

  describe('Custom options', () => {
    it('should respect custom maxExpressionLength', () => {
      const engine = new ExpressionEngine({ maxExpressionLength: 10 })
      const result = engine.processText('{{VERY_LONG_VARIABLE_NAME}}', {})
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('EXPRESSION_TOO_LONG')
    })

    it('should respect custom maxIntervalAmount', () => {
      const engine = new ExpressionEngine({ maxIntervalAmount: 100 })
      const result = engine.processText(
        '{{MY_DATE + 200 days}}',
        { MY_DATE: '2026-02-16' }
      )
      expect(result.errors).toHaveLength(1)
    })

    it('should use custom system variables', () => {
      const customDate = new Date('2025-12-25T00:00:00Z')
      const engine = new ExpressionEngine({
        systemVariables: { DATE: () => customDate }
      })
      const result = engine.processText('{{DATE}}', {})
      expect(result.text).toBe('2025-12-25')
    })
  })

  describe('Backward compatibility', () => {
    it('should still work with old-style {{VAR}} syntax', () => {
      const engine = new ExpressionEngine()
      const result = engine.processText('{{MY_VAR}}', { MY_VAR: 'hello' })
      expect(result.text).toBe('hello')
      expect(result.errors).toHaveLength(0)
    })
  })
})
