import { parse } from './parser'
import { evaluate } from './evaluator'
import { VariableContext, ExpressionEngineOptions, EvaluationError } from './types'

/**
 * Result of text processing with expressions.
 * Contains processed text and any errors encountered.
 */
export interface ProcessResult {
  text: string                    // Processed text with expressions replaced
  errors: EvaluationError[]       // Array of errors (empty if all successful)
}

/**
 * ExpressionEngine is the main high-level API for the expression system.
 * Provides methods for:
 * - Processing text with embedded expressions
 * - Extracting expressions from text
 * - Validating expressions
 * 
 * The engine handles the complete pipeline:
 * Text → Extract {{...}} → Parse → Evaluate → Replace
 * 
 * @example
 * const engine = new ExpressionEngine()
 * const result = engine.processText(
 *   'Ship date: {{SHIP_DATE + 2 days}}',
 *   { SHIP_DATE: '2026-02-16' }
 * )
 * console.log(result.text) // "Ship date: 2026-02-18"
 */
export class ExpressionEngine {
  private options: Required<ExpressionEngineOptions>

  /**
   * Initialize expression engine with optional configuration.
   * 
   * @param options - Configuration options (all optional)
   * @param options.maxExpressionLength - Max characters per expression (default: 200)
   * @param options.maxIntervalAmount - Max interval value (default: 10000)
   * @param options.systemVariables - Custom system variable implementations
   */
  constructor(options?: ExpressionEngineOptions) {
    this.options = {
      maxExpressionLength: options?.maxExpressionLength ?? 200,
      maxIntervalAmount: options?.maxIntervalAmount ?? 10000,
      systemVariables: options?.systemVariables ?? {}
    }
  }

  /**
   * Process text by replacing all {{expression}} tokens with evaluated values.
   * Invalid expressions remain unchanged and errors are collected.
   * 
   * This is the main method for using the expression engine.
   * 
   * @param text - Text containing {{expression}} tokens
   * @param context - Variable values for resolution
   * @returns ProcessResult with processed text and any errors
   * 
   * @example
   * const result = engine.processText(
   *   'Hello {{NAME}}, ship on {{DATE + 2 days}}',
   *   { NAME: 'Alice', DATE: '2026-02-16' }
   * )
   * // result.text: "Hello Alice, ship on 2026-02-18"
   * // result.errors: []
   */
  public processText(text: string, context: VariableContext): ProcessResult {
    const errors: EvaluationError[] = []
    const tokenRegex = /\{\{([^}]+)\}\}/g  // Matches {{...}} tokens
    
    // Replace each {{expression}} with its evaluated value
    const result = text.replace(tokenRegex, (match, expression: string) => {
      const trimmedExpr = expression.trim()
      
      // Step 1: Parse expression to AST
      const parseResult = parse(trimmedExpr, {
        maxExpressionLength: this.options.maxExpressionLength,
        maxIntervalAmount: this.options.maxIntervalAmount
      })

      if (!parseResult.success) {
        // Parse error: leave token unchanged, collect error
        errors.push({
          code: parseResult.error.code,
          message: parseResult.error.message,
          token: match
        })
        return match  // Return original token
      }

      // Step 2: Evaluate AST with context
      const evalResult = evaluate(
        parseResult.value,
        context,
        this.options.systemVariables
      )

      if (!evalResult.success) {
        // Evaluation error: leave token unchanged, collect error
        errors.push(evalResult.error)
        return match  // Return original token
      }

      // Success: return evaluated value
      return evalResult.value
    })

    return { text: result, errors }
  }

  /**
   * Extract all {{expression}} tokens from text.
   * Useful for analyzing what expressions are present.
   * 
   * @param text - Text to extract expressions from
   * @returns Array of expression tokens (including {{ and }})
   * 
   * @example
   * engine.extractExpressions('{{A}} and {{B + 1 day}}')
   * // Returns: ['{{A}}', '{{B + 1 day}}']
   */
  public extractExpressions(text: string): string[] {
    const expressions: string[] = []
    const tokenRegex = /\{\{([^}]+)\}\}/g
    let match: RegExpExecArray | null

    while ((match = tokenRegex.exec(text)) !== null) {
      expressions.push(match[0])
    }

    return expressions
  }

  /**
   * Validate an expression without evaluating it.
   * Checks syntax and grammar only (not variable existence).
   * 
   * @param expression - Expression to validate (with or without {{ }})
   * @returns Validation result with error message if invalid
   * 
   * @example
   * engine.validateExpression('{{MY_DATE + 2 days}}')
   * // Returns: { valid: true }
   * 
   * engine.validateExpression('{{my_date + 2 days}}')
   * // Returns: { valid: false, error: "Expected VAR, got..." }
   */
  public validateExpression(expression: string): { valid: boolean; error?: string } {
    // Strip {{ }} if present
    const innerExpr = expression.replace(/^\{\{|\}\}$/g, '').trim()
    
    // Parse to check syntax
    const parseResult = parse(innerExpr, {
      maxExpressionLength: this.options.maxExpressionLength,
      maxIntervalAmount: this.options.maxIntervalAmount
    })

    if (!parseResult.success) {
      return {
        valid: false,
        error: parseResult.error.message
      }
    }

    return { valid: true }
  }
}
