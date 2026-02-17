import { Tokenizer, Token, isValidTimeUnit, isValidOperator } from './tokenizer'
import { ASTNode, ParseError, ParseResult, Operator, TimeUnit } from './types'

/**
 * Parser converts a stream of tokens into an Abstract Syntax Tree (AST).
 * Uses recursive descent parsing with operator precedence.
 * 
 * Grammar (simplified):
 *   expression := primary (OPERATOR NUMBER UNIT)*
 *   primary    := VAR
 * 
 * Example: "MY_DATE + 2 days" produces:
 *   DateArithmetic {
 *     base: VarRef { name: "MY_DATE" },
 *     operator: "+",
 *     amount: 2,
 *     unit: "days"
 *   }
 */
export class Parser {
  private tokens: Token[]                // Array of tokens to parse
  private current: number = 0            // Current position in token array
  private maxExpressionLength: number    // Security limit for expression length
  private maxIntervalAmount: number      // Security limit for interval values

  /**
   * Initialize parser with tokens and security limits.
   * 
   * @param tokens - Array of tokens from tokenizer
   * @param maxExpressionLength - Maximum allowed expression length
   * @param maxIntervalAmount - Maximum allowed interval amount
   */
  constructor(
    tokens: Token[],
    maxExpressionLength: number = 200,
    maxIntervalAmount: number = 10000
  ) {
    this.tokens = tokens
    this.maxExpressionLength = maxExpressionLength
    this.maxIntervalAmount = maxIntervalAmount
  }

  /**
   * Get the current token being examined.
   * Safe to call even at end of input (returns EOF token).
   */
  private currentToken(): Token {
    return this.tokens[this.current]
  }

  /**
   * Move to the next token.
   * Does not advance past EOF to prevent index out of bounds.
   */
  private advance(): void {
    if (this.currentToken().type !== 'EOF') {
      this.current++
    }
  }

  /**
   * Consume a token of the expected type or throw error.
   * Used for enforcing grammar rules.
   * 
   * @param type - Expected token type
   * @returns The consumed token
   * @throws ParseError if token type doesn't match
   */
  private expect(type: string): Token {
    const token = this.currentToken()
    if (token.type !== type) {
      throw this.error(`Expected ${type}, got ${token.type}`, token)
    }
    this.advance()
    return token
  }

  /**
   * Create a structured parse error with context.
   * 
   * @param message - Human-readable error message
   * @param token - Token where error occurred
   * @returns ParseError object
   */
  private error(message: string, token: Token): ParseError {
    return {
      code: 'PARSE_ERROR',
      message,
      token: token.value,
      position: token.position
    }
  }

  /**
   * Main entry point for parsing.
   * Parses complete expression and ensures no trailing tokens.
   * 
   * @returns AST root node
   * @throws ParseError if parsing fails
   */
  public parse(): ASTNode {
    const expr = this.parseExpression()
    
    // Ensure we consumed all tokens (except EOF)
    if (this.currentToken().type !== 'EOF') {
      throw this.error('Unexpected tokens after expression', this.currentToken())
    }
    
    return expr
  }

  /**
   * Parse an expression with optional date arithmetic.
   * Handles chained operations like: VAR + N unit + M unit
   * 
   * @returns AST node representing the expression
   * @throws ParseError if expression is invalid
   */
  private parseExpression(): ASTNode {
    // Start with primary expression (variable reference)
    let node = this.parsePrimary()

    // Handle zero or more arithmetic operations
    while (this.currentToken().type === 'OPERATOR') {
      const opToken = this.currentToken()
      
      // Validate operator
      if (!isValidOperator(opToken.value)) {
        throw this.error(`Invalid operator '${opToken.value}'`, opToken)
      }
      
      const operator = opToken.value as Operator
      this.advance()

      // Parse interval amount (must be positive integer)
      const numToken = this.expect('NUMBER')
      const amount = parseInt(numToken.value, 10)

      if (!Number.isFinite(amount) || amount <= 0) {
        throw this.error('Interval amount must be a positive integer', numToken)
      }

      // Security check: prevent excessive intervals
      if (amount > this.maxIntervalAmount) {
        throw this.error(
          `Interval amount ${amount} exceeds maximum ${this.maxIntervalAmount}`,
          numToken
        )
      }

      // Parse time unit
      const unitToken = this.expect('UNIT')
      
      if (!isValidTimeUnit(unitToken.value)) {
        throw this.error(
          `Invalid time unit '${unitToken.value}'. Must be one of: day, days, week, weeks, month, months, year, years`,
          unitToken
        )
      }

      const unit = unitToken.value as TimeUnit

      // Build DateArithmetic node with previous node as base
      // This allows chaining: (VAR + 1 day) + 2 weeks
      node = {
        type: 'date_arithmetic',
        base: node,
        operator,
        amount,
        unit
      }
    }

    return node
  }

  /**
   * Parse a primary expression (currently only variable references).
   * This is the base case for the recursive descent parser.
   * 
   * @returns VarRef AST node
   * @throws ParseError if not a valid primary expression
   */
  private parsePrimary(): ASTNode {
    const token = this.currentToken()

    if (token.type === 'VAR') {
      this.advance()
      return {
        type: 'var_ref',
        name: token.value
      }
    }

    throw this.error('Expected variable name', token)
  }
}

/**
 * High-level parse function with error handling.
 * Converts expression string to AST with comprehensive error reporting.
 * 
 * @param expression - Expression string to parse
 * @param options - Optional configuration (limits)
 * @returns ParseResult with either AST or error
 * 
 * @example
 * const result = parse('MY_DATE + 2 days')
 * if (result.success) {
 *   console.log(result.value) // AST node
 * } else {
 *   console.error(result.error) // ParseError
 * }
 */
export function parse(expression: string, options?: { maxExpressionLength?: number; maxIntervalAmount?: number }): ParseResult<ASTNode> {
  const maxExpressionLength = options?.maxExpressionLength ?? 200
  const maxIntervalAmount = options?.maxIntervalAmount ?? 10000

  try {
    // Security check: prevent excessively long expressions
    if (expression.length > maxExpressionLength) {
      return {
        success: false,
        error: {
          code: 'EXPRESSION_TOO_LONG',
          message: `Expression exceeds maximum length of ${maxExpressionLength} characters`,
          token: expression
        }
      }
    }

    // Tokenize → Parse → Return AST
    const tokenizer = new Tokenizer(expression)
    const tokens = tokenizer.tokenize()
    const parser = new Parser(tokens, maxExpressionLength, maxIntervalAmount)
    const ast = parser.parse()

    return { success: true, value: ast }
  } catch (error) {
    // Convert thrown errors to ParseResult format
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return { success: false, error: error as ParseError }
    }
    
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown parse error',
        token: expression
      }
    }
  }
}
