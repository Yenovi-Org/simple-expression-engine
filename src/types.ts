/**
 * Supported time units for date arithmetic operations.
 * Supports both singular and plural forms for better UX.
 */
export type TimeUnit = 'day' | 'days' | 'week' | 'weeks' | 'month' | 'months' | 'year' | 'years'

/**
 * Arithmetic operators supported in expressions.
 * Currently limited to addition and subtraction for MVP.
 */
export type Operator = '+' | '-'

/**
 * Error object returned when expression parsing fails.
 * Contains detailed information about what went wrong and where.
 */
export interface ParseError {
  code: string          // Error code (e.g., "PARSE_ERROR", "EXPRESSION_TOO_LONG")
  message: string       // Human-readable error message
  token: string         // The problematic token or expression
  position?: number     // Optional position in the input string where error occurred
}

/**
 * Error object returned when expression evaluation fails.
 * Contains detailed information about what went wrong.
 */
export interface EvaluationError {
  code: string          // Error code (e.g., "UNDEFINED_VARIABLE", "TYPE_ERROR")
  message: string       // Human-readable error message
  token: string         // The problematic token or expression
}

/**
 * Result type for parsing operations using discriminated union pattern.
 * Either succeeds with a value or fails with an error.
 */
export type ParseResult<T> = 
  | { success: true; value: T }
  | { success: false; error: ParseError }

/**
 * Result type for evaluation operations using discriminated union pattern.
 * Either succeeds with a string value or fails with an error.
 */
export type EvaluationResult = 
  | { success: true; value: string }
  | { success: false; error: EvaluationError }

/**
 * Types of values that can be resolved from variables.
 * Currently supports dates, numbers, and strings.
 */
export type ValueType = 'date' | 'number' | 'string'

/**
 * A typed value with runtime type information.
 * Used by the evaluator to ensure type-safe operations.
 */
export interface TypedValue {
  type: ValueType
  value: Date | number | string
}

/**
 * Abstract Syntax Tree node types.
 * Union of all possible AST node types in the expression grammar.
 */
export type ASTNode = VarRef | DateArithmetic

/**
 * AST node representing a variable reference.
 * Example: {{MY_VAR}} becomes VarRef with name="MY_VAR"
 */
export interface VarRef {
  type: 'var_ref'
  name: string          // Variable name (must match [A-Z_]+)
}

/**
 * AST node representing date arithmetic operation.
 * Example: {{MY_DATE + 2 days}} becomes DateArithmetic node
 */
export interface DateArithmetic {
  type: 'date_arithmetic'
  base: ASTNode         // Base expression (usually a VarRef)
  operator: Operator    // '+' or '-'
  amount: number        // Positive integer amount
  unit: TimeUnit        // Time unit (day, week, month, year)
}

/**
 * Context object containing user-provided variable values.
 * Keys are variable names, values are string representations.
 */
export interface VariableContext {
  [key: string]: string
}

/**
 * System-provided variables that are always available.
 * These are functions that return values at evaluation time.
 */
export interface SystemVariables {
  DATE: () => Date      // Returns current server date as LocalDate
}

/**
 * Configuration options for the ExpressionEngine.
 * All options are optional with sensible defaults.
 */
export interface ExpressionEngineOptions {
  maxExpressionLength?: number              // Max characters per expression (default: 200)
  maxIntervalAmount?: number                // Max interval value in arithmetic (default: 10000)
  systemVariables?: Partial<SystemVariables> // Custom system variable implementations
}
