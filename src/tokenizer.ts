import { TimeUnit, Operator } from './types'

/**
 * Types of tokens recognized by the tokenizer.
 * Each token type represents a different syntactic element.
 */
export type TokenType = 
  | 'VAR'       // Variable name (e.g., MY_DATE)
  | 'OPERATOR'  // Arithmetic operator (+ or -)
  | 'NUMBER'    // Numeric literal (e.g., 2, 10)
  | 'UNIT'      // Time unit (e.g., days, months)
  | 'EOF'       // End of input marker

/**
 * A token with its type, value, and position in the input string.
 * Position tracking enables better error messages.
 */
export interface Token {
  type: TokenType
  value: string
  position: number
}

/**
 * Tokenizer converts input strings into a stream of tokens.
 * Uses a simple character-by-character scanning approach.
 * 
 * Example: "MY_DATE + 2 days" becomes:
 * [VAR("MY_DATE"), OPERATOR("+"), NUMBER("2"), UNIT("days"), EOF]
 */
export class Tokenizer {
  private input: string              // The input string being tokenized
  private position: number = 0       // Current position in input
  private current: string | null = null  // Current character being examined

  /**
   * Initialize tokenizer with input string.
   * Trims whitespace and sets up initial state.
   */
  constructor(input: string) {
    this.input = input.trim()
    this.current = this.input.length > 0 ? this.input[0] : null
  }

  /**
   * Move to the next character in the input.
   * Sets current to null when reaching end of input.
   */
  private advance(): void {
    this.position++
    this.current = this.position < this.input.length ? this.input[this.position] : null
  }

  /**
   * Skip over whitespace characters.
   * Allows flexible spacing in expressions.
   */
  private skipWhitespace(): void {
    while (this.current !== null && /\s/.test(this.current)) {
      this.advance()
    }
  }

  /**
   * Read a variable name (uppercase letters and underscores).
   * Variables must match pattern: [A-Z_]+
   */
  private readVariable(): string {
    const start = this.position
    while (this.current !== null && /[A-Z_]/.test(this.current)) {
      this.advance()
    }
    return this.input.slice(start, this.position)
  }

  /**
   * Read a numeric literal (digits only).
   * Returns the number as a string for later parsing.
   */
  private readNumber(): string {
    const start = this.position
    while (this.current !== null && /[0-9]/.test(this.current)) {
      this.advance()
    }
    return this.input.slice(start, this.position)
  }

  /**
   * Read a time unit (lowercase letters).
   * Units like "day", "days", "month", etc.
   */
  private readUnit(): string {
    const start = this.position
    while (this.current !== null && /[a-z]/.test(this.current)) {
      this.advance()
    }
    return this.input.slice(start, this.position)
  }

  /**
   * Main tokenization method.
   * Scans input and produces array of tokens.
   * Throws error on unexpected characters.
   * 
   * @returns Array of tokens ending with EOF token
   * @throws Error if unexpected character encountered
   */
  public tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.current !== null) {
      this.skipWhitespace()

      if (this.current === null) break

      const tokenPosition = this.position

      // Variable name (uppercase letters and underscores)
      if (/[A-Z_]/.test(this.current)) {
        const value = this.readVariable()
        tokens.push({ type: 'VAR', value, position: tokenPosition })
        continue
      }

      // Operator
      if (isValidOperator(this.current)) {
        const value = this.current
        this.advance()
        tokens.push({ type: 'OPERATOR', value, position: tokenPosition })
        continue
      }

      // Number (digits)
      if (/[0-9]/.test(this.current)) {
        const value = this.readNumber()
        tokens.push({ type: 'NUMBER', value, position: tokenPosition })
        continue
      }

      // Time unit (lowercase letters)
      if (/[a-z]/.test(this.current)) {
        const value = this.readUnit()
        tokens.push({ type: 'UNIT', value, position: tokenPosition })
        continue
      }

      // Unexpected character - fail fast with clear error
      throw new Error(`Unexpected character '${this.current}' at position ${this.position}`)
    }

    // Always end with EOF token to simplify parser logic
    tokens.push({ type: 'EOF', value: '', position: this.position })
    return tokens
  }
}

/**
 * Type guard to check if a string is a valid time unit.
 * Narrows type from string to TimeUnit for type safety.
 */
export function isValidTimeUnit(unit: string): unit is TimeUnit {
  return ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years'].includes(unit)
}

/**
 * Type guard to check if a string is a valid operator.
 * Narrows type from string to Operator for type safety.
 */
export function isValidOperator(op: string): op is Operator {
  return op === '+' || op === '-'
}
