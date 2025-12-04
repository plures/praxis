# Getting Started with Praxis

This guide will help you get started with Praxis quickly.

## Installation

```bash
npm install @plures/praxis
```

## Your First Praxis Engine

Here's a minimal example to get you started:

```typescript
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from '@plures/praxis';

// 1. Define your context type
interface AppContext {
  message: string;
}

// 2. Define facts and events
const MessageSet = defineFact<'MessageSet', { text: string }>('MessageSet');
const SetMessage = defineEvent<'SET_MESSAGE', { text: string }>('SET_MESSAGE');

// 3. Define a rule
const setMessageRule = defineRule<AppContext>({
  id: 'app.setMessage',
  description: 'Update message when SET_MESSAGE event occurs',
  impl: (state, events) => {
    const event = events.find(SetMessage.is);
    if (event) {
      state.context.message = event.payload.text;
      return [MessageSet.create({ text: event.payload.text })];
    }
    return [];
  },
});

// 4. Create the registry and engine
const registry = new PraxisRegistry<AppContext>();
registry.registerRule(setMessageRule);

const engine = createPraxisEngine({
  initialContext: { message: '' },
  registry,
});

// 5. Process events
const result = engine.step([SetMessage.create({ text: 'Hello, Praxis!' })]);

console.log(engine.getContext()); // { message: "Hello, Praxis!" }
console.log(result.state.facts); // [{ tag: "MessageSet", payload: { text: "Hello, Praxis!" } }]
```

## Key Concepts

### Facts

Facts are typed propositions about your domain. They represent "what happened" or "what is true":

```typescript
const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');
const fact = UserLoggedIn.create({ userId: 'alice' });
```

### Events

Events are temporally ordered facts that drive state changes:

```typescript
const Login = defineEvent<'LOGIN', { username: string; password: string }>('LOGIN');
const event = Login.create({ username: 'alice', password: 'secret' });
```

### Rules

Rules are pure functions that produce new facts from events and current state:

```typescript
const loginRule = defineRule<AuthContext>({
  id: 'auth.login',
  description: 'Process login event',
  impl: (state, events) => {
    const loginEvent = events.find(Login.is);
    if (loginEvent) {
      state.context.currentUser = loginEvent.payload.username;
      return [UserLoggedIn.create({ userId: loginEvent.payload.username })];
    }
    return [];
  },
});
```

### Constraints

Constraints are invariants that must hold:

```typescript
const maxUsersConstraint = defineConstraint<AppContext>({
  id: 'app.maxUsers',
  description: 'Cannot exceed 100 active users',
  impl: (state) => {
    const activeUsers = state.context.users?.length ?? 0;
    return activeUsers <= 100 || `Too many users: ${activeUsers}`;
  },
});
```

### Processing Events

```typescript
// Process one or more events
const result = engine.step([
  Login.create({ username: 'alice', password: 'secret' }),
  SetPreference.create({ key: 'theme', value: 'dark' }),
]);

// Check for diagnostics (constraint violations, rule errors)
if (result.diagnostics.length > 0) {
  console.error('Issues:', result.diagnostics);
}

// Access the new state
console.log(result.state.context);
console.log(result.state.facts);
```

## Using with Svelte v5

```typescript
import { createPraxisStore } from '@plures/praxis/svelte';

// Create a store from your engine
const store = createPraxisStore(engine);

// In your Svelte component:
// <script>
//   $: state = $store;
//
//   function handleLogin() {
//     store.dispatch([Login.create({ username: "alice", password: "secret" })]);
//   }
// </script>
```

## Examples

The repository includes three complete examples:

### 1. Auth Basic

Login/logout with session management.

```bash
npm run build
node dist/examples/auth-basic/index.js
```

### 2. Shopping Cart

Complex state management with discounts and constraints.

```bash
npm run build
node dist/examples/cart/index.js
```

### 3. Svelte Counter

Reactive counter with Svelte v5 integration.

```bash
npm run build
node dist/examples/svelte-counter/index.js
```

## Best Practices

### 1. Keep Rules Pure

Rules should not have side effects. Keep them pure and deterministic:

```typescript
// ✓ Good - pure rule
const incrementRule = defineRule({
  id: 'counter.increment',
  impl: (state, events) => {
    if (events.some(Increment.is)) {
      state.context.count += 1;
      return [Incremented.create({ amount: 1 })];
    }
    return [];
  },
});

// ✗ Bad - side effects in rule
const badRule = defineRule({
  id: 'bad.rule',
  impl: (state, events) => {
    fetch('/api/log'); // ✗ Side effect!
    return [];
  },
});
```

### 2. Use Actors for Side Effects

Side effects should go in actors:

```typescript
const logActor: Actor<AppContext> = {
  id: 'logger',
  description: 'Log state changes',
  onStateChange: async (state, engine) => {
    // ✓ Side effects belong here
    await fetch('/api/log', {
      method: 'POST',
      body: JSON.stringify(state.context),
    });
  },
};
```

### 3. Organize with Modules

Bundle related rules and constraints into modules:

```typescript
const authModule = defineModule({
  rules: [loginRule, logoutRule, sessionRefreshRule],
  constraints: [maxSessionsConstraint, sessionTimeoutConstraint],
  meta: { version: '1.0.0', domain: 'authentication' },
});

registry.registerModule(authModule);
```

### 4. Use Type Guards

Take advantage of TypeScript's type narrowing:

```typescript
const event = events.find(Login.is);
if (event) {
  // TypeScript knows event.payload is { username: string; password: string }
  console.log(event.payload.username); // ✓ Type-safe!
}
```

## Testing

Praxis is designed to be easily testable:

```typescript
import { describe, it, expect } from 'vitest';

describe('Login Rule', () => {
  it('should create UserLoggedIn fact', () => {
    const registry = new PraxisRegistry<AuthContext>();
    registry.registerRule(loginRule);

    const engine = createPraxisEngine({
      initialContext: { currentUser: null },
      registry,
    });

    const result = engine.step([Login.create({ username: 'alice', password: 'secret' })]);

    expect(engine.getContext().currentUser).toBe('alice');
    expect(result.state.facts).toHaveLength(1);
    expect(result.state.facts[0]?.tag).toBe('UserLoggedIn');
  });
});
```

## Next Steps

- Read the [README.md](./README.md) for comprehensive documentation
- Explore the examples in `src/examples/`
- Check out the [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture details
- Join the plures community on GitHub

## Need Help?

- File an issue: https://github.com/plures/praxis/issues
- Check the examples: `src/examples/`
- Read the API docs in the README

---

Happy coding with Praxis! 🎯
