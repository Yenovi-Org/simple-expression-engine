import { ASTNode, TypedValue, EvaluationError, EvaluationResult, VariableContext } from './types'
import { VariableResolver } from './variable-resolver'
import { formatDate, addToDate } from './date-utils'

/**
 * Evaluator executes AST nodes and produces typed values.
 * Handles variable resolution, type checking, and date arithmetic.
 * 
 * The evaluator is type-safe and will throw errors for:
 * - Undefined variables
 * - Type mismatches (e.g., arithmetic on non-date values)
 * - Unknown AST node types
 */
export class Evaluator {
  private resolver: VariableResolver  // Resolves variable names to values

  /**
   * Initialize evaluator with variable context.
   * 
   * @param context - User-provided variable values
   * @param systemVariables - Optional custom system variable implementations
   */
  constructor(context: VariableContext, systemVariables?: any) {
    this.resolver = new VariableResolver(context, systemVariables)
  }

  /**
   * Create a structured evaluation error with context.
   */
  private error(code: string, message: string, token: string): EvaluationError {
    return {
      code,
      message,
      token
    }
  }

  /**
   * Main evaluation entry point.
   * Recursively evaluates AST nodes using visitor pattern.
   * 
   * @param node - AST node to evaluate
   * @returns Typed value result
   * @throws EvaluationError if evaluation fails
   */
  public evaluate(node: ASTNode): TypedValue {
    switch (node.type) {
      case 'var_ref':
        return this.evaluateVarRef(node)
      case 'date_arithmetic':
        return this.evaluateDateArithmetic(node)
      default:
        throw this.error('UNKNOWN_NODE_TYPE', `Unknown AST node type`, JSON.stringify(node))
    }
  }

  /**
   * Evaluate a variable reference node.
   * Resolves variable name through the variable resolver.
   * 
   * @param node - VarRef AST node
   * @returns Typed value from variable resolution
   * @throws EvaluationError if variable is undefined
   */
  private evaluateVarRef(node: { type: 'var_ref'; name: string }): TypedValue {
    const value = this.resolver.resolve(node.name)
    
    if (value === null) {
      throw this.error(
        'UNDEFINED_VARIABLE',
        `Variable '${node.name}' is not defined`,
        node.name
      )
    }

    return value
  }

  /**
   * Evaluate a date arithmetic node.
   * Recursively evaluates base expression, then applies date arithmetic.
   * 
   * Type checking ensures base value is a date before performing arithmetic.
   * 
   * @param node - DateArithmetic AST node
   * @returns Typed date value after arithmetic
   * @throws EvaluationError if base is not a date
   */
  private evaluateDateArithmetic(node: {
    type: 'date_arithmetic'
    base: ASTNode
    operator: '+' | '-'
    amount: number
    unit: any
  }): TypedValue {
    // Recursively evaluate base expression
    const baseValue = this.evaluate(node.base)

    // Type check: only dates support arithmetic
    if (baseValue.type !== 'date') {
      throw this.error(
        'TYPE_ERROR',
        `Cannot perform date arithmetic on ${baseValue.type} value`,
        JSON.stringify(node)
      )
    }

    // Perform date arithmetic with month-end clamping
    const resultDate = addToDate(baseValue.value as Date, node.amount, node.unit, node.operator)

    return { type: 'date', value: resultDate }
  }
}

/**
 * High-level evaluate function with error handling and type conversion.
 * Converts AST to final string value with comprehensive error reporting.
 * 
 * @param ast - AST root node to evaluate
 * @param context - Variable context for resolution
 * @param systemVariables - Optional custom system variables
 * @returns EvaluationResult with either string value or error
 * 
 * @example
 * const ast = parse('MY_DATE + 2 days').value
 * const result = evaluate(ast, { MY_DATE: '2026-02-16' })
 * if (result.success) {
 *   console.log(result.value) // "2026-02-18"
 * }
 */
export function evaluate(
  ast: ASTNode,
  context: VariableContext,
  systemVariables?: any
): EvaluationResult {
  try {
    const evaluator = new Evaluator(context, systemVariables)
    const result = evaluator.evaluate(ast)

    // Convert typed value to string based on type
    let stringValue: string

    switch (result.type) {
      case 'date':
        stringValue = formatDate(result.value as Date)
        break
      case 'number':
        stringValue = String(result.value)
        break
      case 'string':
        stringValue = result.value as string
        break
      default:
        throw new Error(`Unknown value type: ${(result as any).type}`)
    }

    return { success: true, value: stringValue }
  } catch (error) {
    // Convert thrown errors to EvaluationResult format
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return { success: false, error: error as EvaluationError }
    }

    return {
      success: false,
      error: {
        code: 'EVALUATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown evaluation error',
        token: ''
      }
    }
  }
}
