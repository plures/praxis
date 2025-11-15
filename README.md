# Praxis

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

# Build the library
npm run build

# Run tests
npm test

# Type check
npm run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by the plures team