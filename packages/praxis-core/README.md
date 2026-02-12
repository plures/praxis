# @plures/praxis-core

Core logic library for the Praxis application framework. This package contains the fundamental primitives for building logic-driven applications with facts, events, rules, constraints, and schemas.

## Overview

`praxis-core` is the foundation of the Praxis framework. It provides:

- **Logic Engine**: Facts, events, rules, constraints, and the execution engine
- **Schema System**: Declarative schema definitions and validation
- **Decision Ledger**: Contracts and behavior specifications for documenting logic
- **Protocol Definitions**: Core protocol types and interfaces
- **Type System**: Shared TypeScript types and utilities

This package has **zero external dependencies** on integration-specific code, making it portable and reusable across different environments (Node.js, browser, Deno, etc.).

## What Belongs in praxis-core

### ✅ Should be in praxis-core

1. **Logic Engine Primitives**
   - `defineFact()`, `defineEvent()`, `defineRule()`, `defineConstraint()`
   - `PraxisEngine` and `PraxisRegistry`
   - Rule execution logic
   - Constraint validation logic
   - Engine state management

2. **Schema System**
   - Schema type definitions
   - Schema validation
   - Schema normalization
   - Schema transformation utilities

3. **Decision Ledger Primitives**
   - `defineContract()`
   - Contract validation
   - Behavior specification types
   - Invariant checking

4. **Protocol Definitions**
   - Core protocol types
   - Message formats
   - State machine definitions

5. **Type Definitions**
   - Shared TypeScript types
   - Generic utilities
   - Type guards

### ❌ Should NOT be in praxis-core

1. **Framework Integrations**
   - Svelte-specific code → `praxis-svelte`
   - React/Vue/Angular code → separate packages
   - UI component generators → integration packages

2. **External Adapters**
   - PluresDB adapter → `praxis-cloud` or separate
   - Unum adapter → `praxis-cloud`
   - HTTP/WebSocket adapters → `praxis-cloud`

3. **CLI Tools**
   - Command-line interface → `praxis-cli`
   - Code generators → `praxis-cli`
   - Project scaffolding → `praxis-cli`

4. **Build/Dev Tools**
   - Build configurations → root or tools/
   - AST analyzers → tools/
   - Watchers → tools/

## Installation

```bash
npm install @plures/praxis-core
```

For Deno:
```bash
deno add @plures/praxis-core
```

## Usage

### Basic Logic Engine

```typescript
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from '@plures/praxis-core';

// Define fact types
const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');

// Define event types
const LoginEvent = defineEvent<'LOGIN', { username: string; password: string }>('LOGIN');

// Define rules
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events and emit UserLoggedIn facts',
  impl: (state, events) => {
    const loginEvt = events.find(LoginEvent.is);
    if (!loginEvt) return [];
    
    // In real app, validate credentials here
    return [UserLoggedIn.create({ userId: loginEvt.payload.username })];
  },
});

// Create registry and register rules
const registry = new PraxisRegistry();
registry.registerRule(loginRule);

// Create engine
const engine = createPraxisEngine({
  initialContext: {},
  registry,
});

// Process events
engine.step([LoginEvent.create({ username: 'alice', password: 'secret' })]);

// Access facts
const userFacts = engine.getFacts(UserLoggedIn.is);
console.log(userFacts); // [{ type: 'UserLoggedIn', payload: { userId: 'alice' } }]
```

### Schema Definitions

```typescript
import { defineSchema, SchemaType } from '@plures/praxis-core';

const userSchema = defineSchema({
  name: 'User',
  fields: {
    id: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: false },
  },
});

// Validate data against schema
const result = userSchema.validate({
  id: 'user-1',
  email: 'alice@example.com',
  age: 30,
});

if (result.valid) {
  console.log('Valid user data');
} else {
  console.error('Validation errors:', result.errors);
}
```

### Decision Ledger Contracts

```typescript
import { defineContract, defineRule } from '@plures/praxis-core';

// Define a contract for a rule's behavior
const loginContract = defineContract({
  rule: 'auth.login',
  description: 'Login rule processes login events and emits UserLoggedIn facts',
  examples: [
    {
      given: 'A LOGIN event with valid credentials',
      when: 'The rule is evaluated',
      then: 'A UserLoggedIn fact is emitted',
    },
  ],
  invariants: [
    'UserLoggedIn facts are only emitted after successful login',
    'Each login event produces at most one UserLoggedIn fact',
  ],
});

// Attach contract to rule metadata
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  meta: {
    contract: loginContract,
  },
  impl: (state, events) => {
    // Implementation
  },
});
```

## API Reference

### Logic Engine

- `createPraxisEngine(config)`: Create a new Praxis engine instance
- `PraxisRegistry`: Registry for rules, constraints, and facts
- `defineFact<Name, Payload>(name)`: Define a fact type
- `defineEvent<Name, Payload>(name)`: Define an event type
- `defineRule<Context>(config)`: Define a rule
- `defineConstraint<Context>(config)`: Define a constraint

### Schema System

- `defineSchema(config)`: Define a schema
- `SchemaType`: Schema type definitions
- `validateSchema(data, schema)`: Validate data against a schema
- `normalizeSchema(schema)`: Normalize a schema definition

### Decision Ledger

- `defineContract(config)`: Define a behavior contract
- `Contract`: Contract type definition
- `Example`: Contract example type
- `Invariant`: Contract invariant type

## Architecture

### Core Principles

1. **Zero Dependencies**: No external integrations or framework-specific code
2. **Pure Functions**: Logic primitives are pure, testable functions
3. **Type Safety**: Fully typed with TypeScript
4. **Immutability**: Facts and events are immutable
5. **Composability**: Small, composable primitives

### Directory Structure

```
packages/praxis-core/
├── src/
│   ├── logic/              # Logic engine primitives
│   │   ├── engine.ts       # Core engine implementation
│   │   ├── rules.ts        # Rule definitions and execution
│   │   ├── facts.ts        # Fact types and utilities
│   │   ├── events.ts       # Event types and utilities
│   │   └── constraints.ts  # Constraint validation
│   ├── schema/             # Schema system
│   │   ├── types.ts        # Schema type definitions
│   │   ├── validator.ts    # Schema validation
│   │   └── normalize.ts    # Schema normalization
│   ├── decision-ledger/    # Decision ledger primitives
│   │   ├── contract.ts     # Contract definitions
│   │   └── validation.ts   # Contract validation
│   ├── protocol/           # Protocol definitions
│   │   └── types.ts        # Protocol types
│   └── index.ts            # Public API exports
├── package.json
├── tsconfig.json
└── README.md
```

## Design Decisions

### Why Zero Dependencies?

Making `praxis-core` dependency-free ensures:
- **Portability**: Can be used in any JavaScript environment
- **Security**: Smaller attack surface
- **Maintainability**: Fewer breaking changes from dependencies
- **Performance**: Smaller bundle size

### Why Separate from Integrations?

Separating core logic from integrations:
- **Clarity**: Clear boundaries between logic and presentation
- **Reusability**: Core can be used with any framework
- **Testing**: Easier to test logic in isolation
- **Versioning**: Core can have different stability guarantees

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

### praxis-core Specific Guidelines

1. **No External Dependencies**: Do not add dependencies to package.json
2. **Pure Functions**: Prefer pure functions over stateful classes
3. **Type Safety**: All exports must be fully typed
4. **Tests**: 100% test coverage for new logic primitives
5. **Documentation**: Document all public APIs with JSDoc comments

## License

MIT - See [LICENSE](../../LICENSE) for details

## Related Packages

- `@plures/praxis`: Main package (re-exports from all packages)
- `@plures/praxis-cli`: Command-line interface
- `@plures/praxis-svelte`: Svelte 5 integration
- `@plures/praxis-cloud`: Cloud sync and relay

## Links

- [Main Documentation](../../docs/README.md)
- [Logic Engine Guide](../../docs/core/logic-engine.md)
- [Schema System Guide](../../docs/core/schema-model.md)
- [Decision Ledger Guide](../../docs/decision-ledger/README.md)
