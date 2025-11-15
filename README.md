# Praxis

**Practical, provable application logic built on strong types.**

Praxis is a typed, functional application logic engine in the [plures ecosystem](https://github.com/plures):

- **unum** – identity and channels ("many as one")
- **pluresdb** – decentralized reactive graph datastore
- **Praxis** – typed, functional application logic engine sitting above data and below UI

## Overview

Praxis is not just a state machine library. It defines a **logic-first model** that can be reused across languages (TypeScript, C#, PowerShell) via a stable, data-oriented protocol and DSL.

### Core Concepts

Praxis exposes these logical building blocks:

- **Facts** – typed propositions about the domain (e.g., `UserLoggedIn`, `CartItem`, `NetworkOnline`)
- **Events** – temporally ordered facts meant to drive change (e.g., `LOGIN`, `LOGOUT`, `ADD_TO_CART`)
- **Rules** – pure, typed functions that derive new facts or transitions from context + input facts/events
- **Constraints** – invariants expressed as types + predicates that must always hold
- **Flows / Scenarios** – orchestrated behaviors (internally may use FSMs, but exposed as logic/DSL)
- **Actors** – effectful units that observe Praxis logic state, perform side effects, and feed new events back

### Design Philosophy

1. **Strong typing and functional programming first**
   - Core abstractions are strongly typed: `Fact<Tag, Payload>`, `Event<Tag, Payload>`, `Rule<Context, InFact, OutFact>`
   - Rules and constraints must be pure (no side effects)
   - Side effects go into actors or explicit effect layers

2. **Logic-first, FSMs as an internal detail**
   - User-facing API is expressed in terms of facts, events, rules, constraints, and actors
   - Not raw FSM configuration

3. **Language-agnostic core protocol**
   - TypeScript-first implementation
   - Designed around a small, language-neutral core protocol for future C#, PowerShell, and other language support
   - JSON-friendly shapes for cross-language compatibility

4. **Provable, analyzable, testable logic**
   - Pure functions make testing straightforward
   - Designed to support automatic documentation generation, visualization, and static/dynamic checks

## Installation

```bash
npm install @plures/praxis
```

## Quick Start

### Basic Example

```typescript
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from "@plures/praxis";

// Define the context type
interface AuthContext {
  currentUser: string | null;
}

// Define facts and events
const UserLoggedIn = defineFact<"UserLoggedIn", { userId: string }>("UserLoggedIn");
const Login = defineEvent<"LOGIN", { username: string }>("LOGIN");

// Define rules
const loginRule = defineRule<AuthContext>({
  id: "auth.login",
  description: "Process login event",
  impl: (state, events) => {
    const loginEvent = events.find(Login.is);
    if (loginEvent) {
      state.context.currentUser = loginEvent.payload.username;
      return [UserLoggedIn.create({ userId: loginEvent.payload.username })];
    }
    return [];
  },
});

// Create engine
const registry = new PraxisRegistry<AuthContext>();
registry.registerRule(loginRule);

const engine = createPraxisEngine({
  initialContext: { currentUser: null },
  registry,
});

// Dispatch events
const result = engine.step([Login.create({ username: "alice" })]);
console.log(result.state.facts); // [{ tag: "UserLoggedIn", payload: { userId: "alice" } }]
console.log(engine.getContext()); // { currentUser: "alice" }
```

### With Constraints

```typescript
import { defineConstraint } from "@plures/praxis";

const maxSessionsConstraint = defineConstraint<AuthContext>({
  id: "auth.maxSessions",
  description: "Only one user can be logged in at a time",
  impl: (state) => {
    return state.context.currentUser === null || "User already logged in";
  },
});

registry.registerConstraint(maxSessionsConstraint);
```

### Svelte v5 Integration

```typescript
import { createPraxisStore, createDerivedStore } from "@plures/praxis/svelte";

const stateStore = createPraxisStore(engine);
const userStore = createDerivedStore(engine, (ctx) => ctx.currentUser);

// In Svelte component:
// $: currentUser = $userStore;
// <button on:click={() => stateStore.dispatch([Login.create({ username: "alice" })])}>
//   Login
// </button>
```

## Core Protocol

The language-neutral core protocol forms the foundation of Praxis:

```typescript
// Facts and Events
interface PraxisFact {
  tag: string;
  payload: unknown;
}

interface PraxisEvent {
  tag: string;
  payload: unknown;
}

// State
interface PraxisState {
  context: unknown;
  facts: PraxisFact[];
  meta?: Record<string, unknown>;
}

// Step Function (the conceptual core)
type PraxisStepFn = (
  state: PraxisState,
  events: PraxisEvent[],
  config: PraxisStepConfig
) => PraxisStepResult;
```

This protocol is:
- Pure and deterministic (data in → data out)
- No side effects, no global state
- JSON-friendly for cross-language compatibility
- The foundation for all higher-level TypeScript APIs

## Architecture

```
src/
├── core/
│   ├── protocol.ts      # Language-neutral protocol
│   ├── rules.ts         # Rules, constraints, and registry
│   ├── engine.ts        # LogicEngine implementation
│   └── actors.ts        # Actor system
├── dsl/
│   └── index.ts         # DSL helpers (defineFact, defineRule, etc.)
├── integrations/
│   ├── svelte.ts        # Svelte v5 adapter
│   └── pluresdb.ts      # PluresDB integration (placeholder)
├── examples/
│   ├── auth-basic/      # Login/logout example
│   ├── cart/            # Shopping cart example
│   └── svelte-counter/  # Svelte integration example
└── index.ts             # Public exports
```

## Examples

The repository includes three complete examples:

### 1. Auth Basic (`src/examples/auth-basic`)
Login/logout with facts, rules, and constraints.

```bash
npm run build
node dist/examples/auth-basic/index.js
```

### 2. Cart (`src/examples/cart`)
Shopping cart with multiple rules, constraints, and complex state management.

```bash
npm run build
node dist/examples/cart/index.js
```

### 3. Svelte Counter (`src/examples/svelte-counter`)
Counter example showing Svelte v5 integration with reactive stores.

```bash
npm run build
node dist/examples/svelte-counter/index.js
```

## API Reference

### Core Types

- `PraxisFact`, `PraxisEvent`, `PraxisState` - Protocol types
- `LogicEngine<TContext>` - Main engine class
- `PraxisRegistry<TContext>` - Rule and constraint registry
- `Actor<TContext>` - Actor interface
- `ActorManager<TContext>` - Actor lifecycle management

### DSL Functions

- `defineFact<TTag, TPayload>(tag)` - Define a typed fact
- `defineEvent<TTag, TPayload>(tag)` - Define a typed event
- `defineRule<TContext>(options)` - Define a rule
- `defineConstraint<TContext>(options)` - Define a constraint
- `defineModule<TContext>(options)` - Bundle rules and constraints

### Helpers

- `findEvent(events, definition)` - Find first matching event
- `findFact(facts, definition)` - Find first matching fact
- `filterEvents(events, definition)` - Filter events by type
- `filterFacts(facts, definition)` - Filter facts by type

## Future Directions

### Ecosystem Integration

- **Svelte v5**: Full reactive binding support (foundation in place)
- **pluresdb**: Reactive datastore integration, event sourcing
- **unum**: Identity/channels and messaging
- **Visualization**: State graphs, rule graphs, constraint graphs
- **ADP**: Architectural guardrails and static checks

### Cross-Language Support

The core protocol is designed to be implemented in other languages:

**C# (future)**:
```csharp
PraxisState Step(PraxisState state, IEnumerable<PraxisEvent> events);
```

**PowerShell (future)**:
```powershell
$newState = Invoke-PraxisStep -State $state -Events $events
```

### Advanced Features

- Prolog/CLP-inspired features (facts, rules, declarative constraints, goal-style interactions)
- Backtracking/search over state space
- Property-based testing support
- Automatic documentation generation
- Static analysis tools

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## License

MIT

## Contributing

Contributions welcome! Please see the [plures organization](https://github.com/plures) for contribution guidelines.

---

**Praxis** – Because application logic should be practical, provable, and portable.