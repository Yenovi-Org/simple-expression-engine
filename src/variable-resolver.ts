import { VariableContext, SystemVariables, TypedValue } from './types'
import { parseDate, getCurrentDate } from './date-utils'

/**
 * Default system variables available in all expressions.
 * These can be overridden via constructor options.
 */
const DEFAULT_SYSTEM_VARIABLES: SystemVariables = {
  DATE: getCurrentDate  // Returns current server date as LocalDate
}

/**
 * VariableResolver handles variable name resolution with priority.
 * 
 * Resolution order:
 * 1. User-provided variables (from context)
 * 2. System variables (DATE, etc.)
 * 
 * User variables always override system variables if names collide.
 * Performs automatic type detection for user variables:
 * - Dates (YYYY-MM-DD or ISO format)
 * - Numbers (numeric strings)
 * - Strings (everything else)
 */
export class VariableResolver {
  private userContext: VariableContext      // User-provided variable values
  private systemVariables: SystemVariables  // System variable implementations

  /**
   * Initialize resolver with contexts.
   * 
   * @param userContext - User-provided variable values
   * @param systemVariables - Optional custom system variable implementations
   */
  constructor(userContext: VariableContext, systemVariables?: Partial<SystemVariables>) {
    this.userContext = userContext
    this.systemVariables = { ...DEFAULT_SYSTEM_VARIABLES, ...systemVariables }
  }

  /**
   * Resolve a variable name to a typed value.
   * Checks user context first, then system variables.
   * 
   * @param name - Variable name to resolve
   * @returns TypedValue if found, null if undefined
   */
  public resolve(name: string): TypedValue | null {
    // Priority 1: User-provided variables
    if (name in this.userContext) {
      return this.resolveUserVariable(name)
    }

    // Priority 2: System variables
    if (name in this.systemVariables) {
      return this.resolveSystemVariable(name)
    }

    // Variable not found
    return null
  }

  /**
   * Resolve user-provided variable with automatic type detection.
   * Tries to parse as date, then number, falls back to string.
   * 
   * @param name - Variable name from user context
   * @returns TypedValue with detected type
   */
  private resolveUserVariable(name: string): TypedValue | null {
    const value = this.userContext[name]
    
    // Try parsing as date (YYYY-MM-DD or ISO datetime)
    const date = parseDate(value)
    if (date !== null) {
      return { type: 'date', value: date }
    }

    // Try parsing as number
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') {
      return { type: 'number', value: num }
    }

    // Default to string
    return { type: 'string', value }
  }

  /**
   * Resolve system variable by calling its implementation function.
   * System variables are evaluated at runtime (e.g., DATE returns current date).
   * 
   * @param name - System variable name
   * @returns TypedValue from system variable function
   */
  private resolveSystemVariable(name: string): TypedValue | null {
    if (name === 'DATE' && this.systemVariables.DATE) {
      const date = this.systemVariables.DATE()
      return { type: 'date', value: date }
    }

    return null
  }
}
