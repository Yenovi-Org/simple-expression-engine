# Variable Expression Engine

A robust expression engine for dynamic variable evaluation with date arithmetic support.

## Features

- ✅ **Date Arithmetic**: Add or subtract days, weeks, months, and years
- ✅ **System Variables**: Built-in `DATE` variable for current date
- ✅ **User Variables**: Support for custom variables from context
- ✅ **Priority Resolution**: User variables override system variables
- ✅ **Type Safety**: Full TypeScript support with comprehensive types
- ✅ **Error Handling**: Graceful error handling with detailed error messages
- ✅ **Backward Compatible**: Works with existing `{{VAR}}` syntax
- ✅ **Extensible Architecture**: AST-based parser for future enhancements
- ✅ **Security**: No `eval()`, strict grammar, configurable limits

## Installation

```bash
npm install simple-expression-engine
```

## Usage

### Basic Example

```typescript
import { ExpressionEngine } from 'simple-expression-engine'

const engine = new ExpressionEngine()

// Simple variable replacement
const result1 = engine.processText('Hello {{NAME}}', { NAME: 'World' })
console.log(result1.text) // "Hello World"

// Date arithmetic
const result2 = engine.processText(
  'Ship date: {{SHIP_DATE + 2 days}}',
  { SHIP_DATE: '2026-02-16' }
)
console.log(result2.text) // "Ship date: 2026-02-18"

// System DATE variable
const result3 = engine.processText('Today: {{DATE}}', {})
console.log(result3.text) // "Today: 2026-02-16" (current date)
```

### Supported Syntax

#### Simple Variables
```
{{MY_VAR}}
{{SHIP_DATE}}
{{CUSTOMER_NAME}}
```

#### Date Arithmetic
```
{{MY_DATE + 2 days}}
{{SHIP_DATE - 7 days}}
{{DATE + 1 week}}
{{MY_DATE + 2 months}}
{{SHIP_DATE - 1 year}}
```

#### Chained Operations
```
{{MY_DATE + 1 month + 2 days}}
{{SHIP_DATE - 1 week - 3 days}}
```

### Grammar Rules

**Variables:**
- Must be uppercase letters and underscores: `[A-Z_]+`
- Case-sensitive

**Operators:**
- `+` (addition)
- `-` (subtraction)

**Time Units:**
- `day`, `days`
- `week`, `weeks` (7 days)
- `month`, `months`
- `year`, `years`

**Intervals:**
- Must be positive integers
- Default max: 10,000 (configurable)

### Date Handling

**Input Formats:**
- `YYYY-MM-DD` (e.g., `2026-02-16`)
- ISO datetime (e.g., `2026-02-16T14:30:00Z`) - extracts date part

**Output Format:**
- Always `YYYY-MM-DD`

**Month/Year Arithmetic:**
- Clamps to last day of month if day doesn't exist
- Example: `2026-01-31 + 1 month` → `2026-02-28`
- Example: `2024-02-29 + 1 year` → `2025-02-28`

### System Variables

**DATE:**
- Returns current server date as `LocalDate`
- Timezone-consistent
- Can be overridden by user context

### Error Handling

Errors do not break rendering - invalid expressions remain unchanged:

```typescript
const result = engine.processText('{{INVALID + bad}}', {})
console.log(result.text) // "{{INVALID + bad}}" (unchanged)
console.log(result.errors) // Array of error objects
```

**Error Structure:**
```typescript
interface EvaluationError {
  code: string        // Error code (e.g., "UNDEFINED_VARIABLE")
  message: string     // Human-readable message
  token: string       // The problematic token
  fieldId?: string    // Optional field identifier
}
```

### Configuration Options

```typescript
const engine = new ExpressionEngine({
  maxExpressionLength: 200,    // Max characters per expression
  maxIntervalAmount: 10000,     // Max interval value (e.g., days)
  systemVariables: {
    DATE: () => new Date('2025-12-25') // Custom DATE function
  }
})
```

### Validation

Validate expressions before processing:

```typescript
const validation = engine.validateExpression('{{MY_DATE + 2 days}}')
if (!validation.valid) {
  console.error(validation.error)
}
```

### Extract Expressions

Extract all expressions from text:

```typescript
const expressions = engine.extractExpressions('{{A}} and {{B + 1 day}}')
console.log(expressions) // ['{{A}}', '{{B + 1 day}}']
```

## Advanced Usage

### Custom System Variables

```typescript
const engine = new ExpressionEngine({
  systemVariables: {
    DATE: () => {
      // Custom logic for DATE
      return new Date('2025-12-25')
    }
  }
})
```

### Field-Level Error Tracking

```typescript
import { parse, evaluate } from 'simple-expression-engine'

const parseResult = parse('MY_DATE + 2 days')
if (parseResult.success) {
  const evalResult = evaluate(
    parseResult.value,
    { MY_DATE: '2026-02-16' },
    'field-123' // Field ID for error tracking
  )
  
  if (!evalResult.success) {
    console.log(evalResult.error.fieldId) // "field-123"
  }
}
```

### Low-Level API

For advanced use cases, use the low-level parser and evaluator:

```typescript
import { parse, evaluate } from 'simple-expression-engine'

// Parse expression to AST
const parseResult = parse('MY_DATE + 2 days')

if (parseResult.success) {
  // Evaluate AST with context
  const evalResult = evaluate(parseResult.value, { MY_DATE: '2026-02-16' })
  
  if (evalResult.success) {
    console.log(evalResult.value) // "2026-02-18"
  }
}
```

## Architecture

The engine uses a proper compiler architecture:

```
Input → Tokenizer → Parser → AST → Evaluator → Output
```

1. **Tokenizer**: Converts input string into tokens
2. **Parser**: Builds Abstract Syntax Tree (AST) from tokens
3. **AST**: Represents expression structure
4. **Evaluator**: Executes AST with variable context
5. **Output**: Formatted result string

This architecture allows for future extensions like:
- Mathematical operations
- Function calls
- String operations
- Conditional expressions

## Security

- ❌ No `eval()` or dynamic code execution
- ✅ Strict grammar validation
- ✅ Configurable expression length limits
- ✅ Configurable interval amount limits
- ✅ Type-safe evaluation

## Testing

The package includes comprehensive unit tests:

```bash
npm test           # Run tests once
npm run test:watch # Watch mode
```

Tests cover:
- Parser (valid/invalid expressions)
- Date arithmetic (all units, edge cases)
- Variable resolution (user/system priority)
- Error handling
- Month-end clamping
- Leap year handling

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  ASTNode,
  ParseResult,
  EvaluationResult,
  VariableContext,
  ExpressionEngineOptions,
  EvaluationError,
  TimeUnit,
  Operator
} from 'simple-expression-engine'
```

## License

MIT

## Contributing

This package is designed to be moved to a separate repository. When contributing:
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure backward compatibility
