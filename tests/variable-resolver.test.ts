import { describe, it, expect } from 'vitest'
import { VariableResolver } from '../src/variable-resolver'

describe('VariableResolver', () => {
  describe('User variables', () => {
    it('should resolve date string as date type', () => {
      const resolver = new VariableResolver({ MY_DATE: '2026-02-16' })
      const result = resolver.resolve('MY_DATE')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('date')
    })

    it('should resolve ISO datetime as date type', () => {
      const resolver = new VariableResolver({ MY_DATE: '2026-02-16T14:30:00Z' })
      const result = resolver.resolve('MY_DATE')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('date')
    })

    it('should resolve numeric string as number type', () => {
      const resolver = new VariableResolver({ COUNT: '42' })
      const result = resolver.resolve('COUNT')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('number')
      expect(result?.value).toBe(42)
    })

    it('should resolve non-date, non-number as string type', () => {
      const resolver = new VariableResolver({ NAME: 'John Doe' })
      const result = resolver.resolve('NAME')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('string')
      expect(result?.value).toBe('John Doe')
    })

    it('should return null for undefined variable', () => {
      const resolver = new VariableResolver({})
      const result = resolver.resolve('UNDEFINED')
      expect(result).toBeNull()
    })
  })

  describe('System variables', () => {
    it('should resolve DATE system variable', () => {
      const resolver = new VariableResolver({})
      const result = resolver.resolve('DATE')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('date')
      expect(result?.value).toBeInstanceOf(Date)
    })

    it('should use custom system variable function', () => {
      const customDate = new Date('2025-12-25T00:00:00Z')
      const resolver = new VariableResolver({}, { DATE: () => customDate })
      const result = resolver.resolve('DATE')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('date')
      expect(result?.value).toEqual(customDate)
    })
  })

  describe('Priority', () => {
    it('should prioritize user variable over system variable', () => {
      const resolver = new VariableResolver({ DATE: '2025-01-01' })
      const result = resolver.resolve('DATE')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('date')
      if (result?.type === 'date') {
        const date = result.value as Date
        expect(date.getUTCFullYear()).toBe(2025)
        expect(date.getUTCMonth()).toBe(0)
        expect(date.getUTCDate()).toBe(1)
      }
    })
  })
})
