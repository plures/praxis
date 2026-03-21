# Getting Started with Praxis 2.0

Get up and running in under five minutes.

## Installation

```bash
npm install @plures/praxis
```

> Requires Node 18+. Works with npm, pnpm, or yarn.

## Option A: Unified App (zero boilerplate)

The quickest path — define state, rules, and constraints in one `createApp()` call:

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

// 1. Declare state paths
const Count = definePath<number>('count', 0);

// 2. Add a constraint
const notNegative = defineConstraint({
  id: 'count.not-negative',
  watch: ['count'],
  validate: (v) => v['count'] >= 0 || 'Count cannot be negative',
});

// 3. Add a rule
const doubled = defineRule({
  id: 'count.doubled',
  watch: ['count'],
  evaluate: (v) => RuleResult.emit([fact('count.doubled', { value: v['count'] * 2 })]),
});

// 4. Create and use
const app = createApp({
  name: 'counter',
  schema: [Count],
  rules: [doubled],
  constraints: [notNegative],
});

app.mutate('count', 5);
console.log(app.query('count').current);        // 5
console.log(app.mutate('count', -1).accepted);  // false
```

## Option B: Classic Engine (full control)

For scenarios needing typed events, facts, actors, and undo/redo history:

```ts
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from '@plures/praxis';

// Define typed facts and events
const MessageSet = defineFact<'MessageSet', { text: string }>('MessageSet');
const SetMessage = defineEvent<'SET_MESSAGE', { text: string }>('SET_MESSAGE');

// Define a rule
const setMessageRule = defineRule<{ message: string }>({
  id: 'app.setMessage',
  description: 'Update message on SET_MESSAGE event',
  impl: (state, events) => {
    const event = events.find(SetMessage.is);
    if (event) {
      state.context.message = event.payload.text;
      return [MessageSet.create({ text: event.payload.text })];
    }
    return [];
  },
});

// Create registry and engine
const registry = new PraxisRegistry();
registry.registerRule(setMessageRule);

const engine = createPraxisEngine({ initialContext: { message: '' }, registry });

// Process events
const result = engine.step([SetMessage.create({ text: 'Hello, Praxis!' })]);
console.log(engine.getContext());  // { message: "Hello, Praxis!" }
console.log(result.state.facts);   // [{ tag: "MessageSet", payload: { text: "Hello, Praxis!" } }]
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Fact** | A typed proposition about your domain — "what is true" |
| **Event** | A temporal trigger that drives state changes |
| **Rule** | A pure function that produces facts from events and state |
| **Constraint** | An invariant that must hold after every mutation |
| **Path** (v2.0) | A named state slot in the reactive graph |

### Facts & Events

```ts
const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');
const Login = defineEvent<'LOGIN', { username: string }>('LOGIN');

const myFact  = UserLoggedIn.create({ userId: 'alice' });
const myEvent = Login.create({ username: 'alice' });
```

### Rules

```ts
const loginRule = defineRule<{ currentUser: string | null }>({
  id: 'auth.login',
  description: 'Process login event',
  impl: (state, events) => {
    const evt = events.find(Login.is);
    if (!evt) return [];
    state.context.currentUser = evt.payload.username;
    return [UserLoggedIn.create({ userId: evt.payload.username })];
  },
});
```

### Constraints

```ts
import { defineConstraint } from '@plures/praxis';

const maxUsersConstraint = defineConstraint<{ users: string[] }>({
  id: 'app.maxUsers',
  description: 'Cannot exceed 100 active users',
  impl: (state) => {
    return state.context.users.length <= 100 || `Too many users: ${state.context.users.length}`;
  },
});
```

### Processing Events

```ts
const result = engine.step([
  Login.create({ username: 'alice' }),
  SetPreference.create({ key: 'theme', value: 'dark' }),
]);

if (result.diagnostics.length > 0) {
  console.error('Issues:', result.diagnostics);
}
```

## Svelte 5 Integration

### Runes API

```svelte
<script lang="ts">
  import { usePraxisEngine } from '@plures/praxis/svelte';
  import { myEngine, Login } from './my-engine';

  const { context, dispatch, undo, redo, canUndo, canRedo } = usePraxisEngine(myEngine, {
    enableHistory: true,
  });
</script>

<p>User: {context.currentUser || 'Guest'}</p>
<button onclick={() => dispatch([Login.create({ username: 'alice' })])}>Login</button>
<button onclick={undo} disabled={!canUndo}>⟲ Undo</button>
```

### Store API

```ts
import { createPraxisStore, createDerivedStore } from '@plures/praxis/svelte';

const store     = createPraxisStore(engine);
const userStore = createDerivedStore(engine, (ctx) => ctx.currentUser);
```

## Best Practices

1. **Keep rules pure** — no `fetch()`, no I/O, no timers inside rule `impl`.
2. **Use actors for side effects** — logging, API calls, and analytics belong in actors.
3. **Organize with modules** — bundle related rules and constraints via `defineModule()`.
4. **Use type guards** — `events.find(Login.is)` gives you fully typed payloads.

## Testing

Praxis logic is trivially testable — no mocks required:

```ts
import { describe, it, expect } from 'vitest';

describe('Login Rule', () => {
  it('should create UserLoggedIn fact', () => {
    const registry = new PraxisRegistry();
    registry.registerRule(loginRule);

    const engine = createPraxisEngine({ initialContext: { currentUser: null }, registry });
    const result = engine.step([Login.create({ username: 'alice' })]);

    expect(engine.getContext().currentUser).toBe('alice');
    expect(result.state.facts).toHaveLength(1);
    expect(result.state.facts[0]?.tag).toBe('UserLoggedIn');
  });
});
```

## Examples

Browse the full set of examples:

| Example | Path |
|---------|------|
| Unified App | [`examples/unified-app/`](./examples/unified-app/) |
| Hero E-Commerce | [`src/examples/hero-ecommerce/`](./src/examples/hero-ecommerce/) |
| Auth Basic | [`src/examples/auth-basic/`](./src/examples/auth-basic/) |
| Shopping Cart | [`src/examples/cart/`](./src/examples/cart/) |
| Terminal Node | [`examples/terminal-node/`](./examples/terminal-node/) |
| Decision Ledger | [`examples/decision-ledger/`](./examples/decision-ledger/) |

## Next Steps

- [README.md](./README.md) — full API reference and feature overview
- [Framework Architecture](./FRAMEWORK.md) — design and module map
- [Svelte Integration Guide](./docs/guides/svelte-integration.md) — deep Svelte 5 walkthrough
- [Decision Ledger Guide](./docs/decision-ledger/DOGFOODING.md) — behavior contracts
- [Migration from 1.x](./MIGRATION_GUIDE.md) — upgrade path from 1.x
- [Tutorials](./docs/tutorials/) — step-by-step guides

## Need Help?

- [File an issue](https://github.com/plures/praxis/issues)
- [GitHub Discussions](https://github.com/plures/praxis/discussions)
- Browse the examples in `examples/` and `src/examples/`
