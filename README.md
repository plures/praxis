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
**TypeScript library for typed, functional application logic.**

**Logic-first:** facts, events, rules, constraints, flows, actors. FSMs are internal tools, not the main API.

Core is a pure, JSON-friendly step over `PraxisState`/`PraxisEvent`. Designed for future interoperability with C# and PowerShell.

## Features

- 🎯 **Logic-First Design**: Build applications around facts, events, rules, and constraints
- 🔄 **Pure Functional Core**: State transitions via pure `step` functions
- 📝 **Fluent DSL**: Intuitive API for defining rules and constraints
- 🗂️ **Registry System**: Centralized management of rules and constraints
- 🌊 **Flows & Actors**: Orchestrate complex state transitions
- 📦 **JSON-Friendly**: All types are serializable for cross-platform use
- 🔒 **Type-Safe**: Full TypeScript support with strict typing

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
```typescript
import {
  createRegistry,
  createStepFunction,
  rule,
  constraint,
  type PraxisState,
  type PraxisEvent,
} from '@plures/praxis';

// Define your state
interface AppState extends PraxisState {
  facts: {
    count: number;
    lastAction?: string;
  };
}

// Create a registry
const registry = createRegistry<AppState, PraxisEvent>();

// Define rules using the DSL
const incrementRule = rule<AppState, PraxisEvent>()
  .id('increment')
  .describe('Increment counter when increment event occurs')
  .on('INCREMENT')
  .when((state, event) => true)
  .then((state, event) => [{
    type: 'LOG',
    payload: { message: 'Counter incremented' }
  }])
  .build();

// Define constraints
const positiveCountConstraint = constraint<AppState>()
  .id('positive-count')
  .describe('Count must be non-negative')
  .check((state) => state.facts.count >= 0)
  .message('Count cannot be negative')
  .build();

// Register rules and constraints
registry.registerRule(incrementRule);
registry.registerConstraint(positiveCountConstraint);

// Create a step function with custom reducer
const step = createStepFunction<AppState, PraxisEvent>({
  registry,
  checkConstraints: true,
  reducer: (state, event) => {
    if (event.type === 'INCREMENT') {
      return {
        ...state,
        facts: {
          ...state.facts,
          count: state.facts.count + 1,
          lastAction: 'increment',
        },
      };
    }
    return state;
  },
});

// Use the step function
const initialState: AppState = {
  facts: { count: 0 },
};

const event: PraxisEvent = {
  type: 'INCREMENT',
  timestamp: Date.now(),
};

const result = step(initialState, event);
console.log(result.state.facts.count); // 1
console.log(result.effects); // [{ type: 'LOG', payload: { message: 'Counter incremented' } }]
```

## Core Concepts

### State and Events

**PraxisState** represents the current facts and context:

```typescript
interface PraxisState {
  facts: Record<string, unknown>;
  metadata?: {
    version?: number;
    lastUpdated?: number;
    [key: string]: unknown;
  };
}
```

**PraxisEvent** represents things that have happened:

```typescript
interface PraxisEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
  metadata?: {
    correlationId?: string;
    source?: string;
    [key: string]: unknown;
  };
}
```

### Rules

Rules are condition-action pairs that fire when conditions are met:

```typescript
const myRule = rule<MyState, MyEvent>()
  .id('my-rule')
  .describe('What this rule does')
  .priority(10) // Higher priority rules execute first
  .on('EVENT_TYPE') // Optional: only check for specific event types
  .when((state, event) => {
    // Condition: return true to fire the rule
    return state.facts.someValue > 10;
  })
  .then((state, event) => {
    // Action: return effects to execute
    return [
      { type: 'SEND_EMAIL', payload: { to: 'user@example.com' } },
      { type: 'LOG', payload: { level: 'info', message: 'Rule fired' } },
    ];
  })
  .build();
```

### Constraints

Constraints are invariants that must hold true:

```typescript
const myConstraint = constraint<MyState>()
  .id('my-constraint')
  .describe('What this constraint ensures')
  .check((state) => {
    // Return true if constraint is satisfied
    return state.facts.balance >= 0;
  })
  .message('Balance cannot be negative')
  .build();
```

### Registry

The registry manages rules and constraints:

```typescript
const registry = createRegistry<MyState, MyEvent>();

// Register rules and constraints
registry.registerRule(myRule);
registry.registerConstraint(myConstraint);

// Evaluate rules for a state transition
const effects = registry.evaluateRules(state, event);

// Check constraints
const violations = registry.checkConstraints(state);

// Get statistics
const stats = registry.getStats();
```

### Step Functions

Step functions are pure functions that transition state:

```typescript
// With registry integration
const step = createStepFunction({
  registry,
  checkConstraints: true,
  reducer: (state, event) => {
    // Your state transition logic
    return newState;
  },
});

// Simple step without registry
const simpleStep = step((state, event) => {
  // Direct state transformation
  return { ...state, facts: { ...state.facts, updated: true } };
});

// Compose multiple step functions
const composedStep = compose(step1, step2, step3);
```

### Actors

Actors maintain their own state and respond to events:

```typescript
import { createActor, createActorSystem } from '@plures/praxis';

// Create an actor
const myActor = createActor(
  'actor-1',
  initialState,
  stepFunction,
  'counter-actor'
);

// Create an actor system
const system = createActorSystem();
system.register(myActor);

// Send events to actors
const result = system.send('actor-1', event);

// Broadcast to all actors
const results = system.broadcast(event);
```

### Flows

Flows represent sequences of events:

```typescript
import { createFlow, advanceFlow } from '@plures/praxis';

// Define a flow
const flow = createFlow('onboarding-flow', [
  { id: 'step1', expectedEventType: 'USER_REGISTERED' },
  { id: 'step2', expectedEventType: 'EMAIL_VERIFIED' },
  { id: 'step3', expectedEventType: 'PROFILE_COMPLETED' },
]);

// Advance the flow with events
const { flow: updatedFlow, accepted } = advanceFlow(flow, event);

if (updatedFlow.complete) {
  console.log('Flow completed!');
}
```

## Architecture Principles

1. **Pure Functions**: State transitions are pure, predictable, and testable
2. **JSON-Friendly**: All data structures serialize to JSON for interoperability
3. **Logic-First**: Focus on business logic, not implementation details
4. **Composable**: Build complex behavior from simple, reusable pieces
5. **Type-Safe**: Leverage TypeScript for compile-time guarantees

## Advanced Usage

### Custom Event Types

```typescript
interface UserEvent extends PraxisEvent {
  type: 'USER_LOGIN' | 'USER_LOGOUT';
  data: {
    userId: string;
    sessionId: string;
  };
}

const registry = createRegistry<AppState, UserEvent>();
```

### Effect Handlers

Effects are side-effect descriptions that can be executed outside the pure core:

```typescript
async function executeEffects(effects: Effect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case 'SEND_EMAIL':
        await emailService.send(effect.payload);
        break;
      case 'LOG':
        console.log(effect.payload);
        break;
      // Add more effect handlers as needed
    }
  }
}

const result = step(state, event);
if (result.effects) {
  await executeEffects(result.effects);
}
```

## Future Roadmap

- 🌐 **Svelte v5 Integration**: First-class support for Svelte 5 runes
- 🗄️ **pluresdb/unum Integration**: Persistent state management
- 🔄 **C# Port**: Cross-platform compatibility
- ⚡ **PowerShell Module**: Scripting and automation support
- 🎭 **Advanced FSM Tools**: Internal state machine utilities
- 📊 **Visualization**: Flow and state visualization tools

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
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! Please see the [plures organization](https://github.com/plures) for contribution guidelines.

---

**Praxis** – Because application logic should be practical, provable, and portable.

---

Built with ❤️ by the plures team
