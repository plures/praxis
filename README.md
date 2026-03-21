# Praxis

[![CI](https://github.com/plures/praxis/actions/workflows/ci.yml/badge.svg)](https://github.com/plures/praxis/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40plures%2Fpraxis.svg)](https://www.npmjs.com/package/@plures/praxis)
[![JSR](https://jsr.io/badges/@plures/praxis)](https://jsr.io/@plures/praxis)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**The full-stack declarative application framework — typed logic, reactive state, local-first data, and visual tooling for Svelte, Node, and the browser.**

Praxis 2.0 gives you a single `createApp()` call that wires reactive state, constraint validation, rule evaluation, and an immutable timeline — zero boilerplate. When you need deeper control, drop down to the classic engine with registries, typed events/facts, and undo/redo history.

## Install

Node 18+ recommended.

```bash
npm install @plures/praxis   # or: pnpm add @plures/praxis
```

## Quick Start — Unified App (v2.0)

The fastest way to build with Praxis. Define paths (state), rules, and constraints — Praxis handles the rest.

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

// 1. Declare your state shape
const Count = definePath<number>('count', 0);
const Max   = definePath<number>('max', 10);

// 2. Add constraints
const notNegative = defineConstraint({
  id: 'count.not-negative',
  description: 'Count must never go below zero',
  watch: ['count'],
  validate: (values) => values['count'] >= 0 || 'Count cannot be negative',
});

// 3. Add rules
const capAtMax = defineRule({
  id: 'count.cap',
  watch: ['count', 'max'],
  evaluate: (values) => {
    if (values['count'] > values['max']) {
      return RuleResult.emit([fact('count.capped', { at: values['max'] })]);
    }
    return RuleResult.noop();
  },
});

// 4. Create the app
const app = createApp({
  name: 'counter',
  schema: [Count, Max],
  rules: [capAtMax],
  constraints: [notNegative],
});

// 5. Query & mutate
const count = app.query<number>('count');
console.log(count.current); // 0

app.mutate('count', 5);
console.log(count.current); // 5

const result = app.mutate('count', -1);
console.log(result.accepted); // false — constraint rejected
```

## Classic Engine (full control)

For complex scenarios that need typed events, facts, actors, and undo/redo:

```ts
import {
  createPraxisEngine,
  PraxisRegistry,
  defineFact,
  defineEvent,
  defineRule,
} from '@plures/praxis';

const UserLoggedIn = defineFact<'UserLoggedIn', { userId: string }>('UserLoggedIn');
const Login = defineEvent<'LOGIN', { username: string }>('LOGIN');

const loginRule = defineRule<{ currentUser: string | null }>({
  id: 'auth.login',
  description: 'Authenticate and emit fact',
  impl: (state, events) => {
    const evt = events.find(Login.is);
    if (!evt) return [];
    state.context.currentUser = evt.payload.username;
    return [UserLoggedIn.create({ userId: evt.payload.username })];
  },
});

const registry = new PraxisRegistry();
registry.registerRule(loginRule);

const engine = createPraxisEngine({ initialContext: { currentUser: null }, registry });
engine.step([Login.create({ username: 'alex' })]);
console.log(engine.getContext()); // { currentUser: 'alex' }
```

## Svelte 5 Integration

### Runes API

```svelte
<script lang="ts">
  import { usePraxisEngine } from '@plures/praxis/svelte';
  import { createMyEngine, Login } from './my-engine';

  const engine = createMyEngine();
  const { context, dispatch, undo, redo, canUndo, canRedo } = usePraxisEngine(engine, {
    enableHistory: true,
    maxHistorySize: 50,
  });
</script>

<p>User: {context.currentUser || 'Guest'}</p>
<button onclick={() => dispatch([Login.create({ username: 'alice' })])}>Login</button>
<button onclick={undo} disabled={!canUndo}>⟲ Undo</button>
<button onclick={redo} disabled={!canRedo}>⟳ Redo</button>
```

### Store API

```ts
import { createPraxisStore, createDerivedStore } from '@plures/praxis/svelte';

const stateStore = createPraxisStore(engine);
const userStore  = createDerivedStore(engine, (ctx) => ctx.currentUser);
```

See [Svelte Integration Guide](./docs/guides/svelte-integration.md) for the full API including reactive engine, history patterns, and keyboard shortcuts.

## Decision Ledger (Behavior Contracts)

Attach explicit contracts to every rule and constraint — with Given/When/Then examples, invariants, and assumption tracking.

```ts
import { defineContract, defineRule } from '@plures/praxis';

const loginContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Process login events and create user session facts',
  examples: [
    { given: 'Valid credentials', when: 'LOGIN event', then: 'UserSessionCreated fact emitted' }
  ],
  invariants: ['Session must have unique ID'],
});

const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => { /* ... */ },
  contract: loginContract,
});
```

```bash
npm run scan:rules           # Index all rules/constraints
npm run validate:contracts   # Validate all contracts
npx praxis validate --strict # CI/CD enforcement
```

See [Decision Ledger Guide](./docs/decision-ledger/DOGFOODING.md) for the full dogfooding workflow.

## PluresDB — Local-First Persistence

```ts
import { createInMemoryDB, createPluresDBAdapter } from '@plures/praxis';

const db = createInMemoryDB();
const adapter = createPluresDBAdapter({ db, registry });
adapter.attachEngine(engine); // auto-persist facts & events
```

For production, use the official [@plures/pluresdb](https://www.npmjs.com/package/@plures/pluresdb) package with P2P sync and CRDT conflict resolution:

```ts
import { PluresNode } from '@plures/pluresdb';
import { createPluresDB } from '@plures/praxis';

const db = createPluresDB(new PluresNode({ config: { port: 34567, dataDir: './data' }, autoStart: true }));
```

## CLI

```bash
npx praxis --help
npx praxis create app my-app
npx praxis generate --schema src/schemas/app.schema.ts
npx praxis canvas src/schemas/app.schema.ts
```

## Exports

| Import path | Description |
|---|---|
| `@plures/praxis` | Core engine, DSL, protocol types, integrations |
| `@plures/praxis/unified` | `createApp()` unified reactive layer |
| `@plures/praxis/svelte` | Svelte 5 runes + store APIs |
| `@plures/praxis/schema` | Schema types and loaders |
| `@plures/praxis/component` | Svelte component generator |
| `@plures/praxis/cloud` | Cloud relay sync |
| `@plures/praxis/components` | Built-in Svelte components |
| `@plures/praxis/mcp` | Model Context Protocol tools |
| `@plures/praxis/expectations` | Behavior expectation DSL |
| `@plures/praxis/factory` | Pre-built UI rule modules |
| `@plures/praxis/project` | Project gates and lifecycle |
| `praxis` (bin) | CLI entrypoint |

## Core Protocol

All Praxis APIs build on a language-neutral, pure-function protocol:

```ts
interface PraxisFact  { tag: string; payload: unknown }
interface PraxisEvent { tag: string; payload: unknown }
interface PraxisState { context: unknown; facts: PraxisFact[]; meta?: Record<string, unknown> }

// The conceptual core — pure, deterministic, no side effects
type PraxisStepFn = (state: PraxisState, events: PraxisEvent[], config: PraxisStepConfig) => PraxisStepResult;
```

Implemented in TypeScript (npm), C# (.NET 8+, NuGet: `Plures.Praxis`), and PowerShell. All share the same JSON wire format. See [CROSS_LANGUAGE_SYNC.md](./CROSS_LANGUAGE_SYNC.md) and [PROTOCOL_VERSIONING.md](./PROTOCOL_VERSIONING.md).

## Examples

| Example | Description | Location |
|---|---|---|
| Hero E-Commerce | Full-stack: auth, cart, discounts, loyalty, actors | `src/examples/hero-ecommerce/` |
| Decision Ledger | Contracts, validation, SARIF output | `examples/decision-ledger/` |
| Offline Chat | Local-first messaging with PluresDB | `examples/offline-chat/` |
| Terminal Node | Command execution with YAML schemas | `examples/terminal-node/` |
| Unified App | `createApp()` + rules + Mermaid docs | `examples/unified-app/` |
| Cloud Sync | Real-time relay synchronization | `examples/cloud-sync/` |
| Simple App | Minimal schema usage | `examples/simple-app/` |
| Reactive Counter | Framework-agnostic reactive engine | `examples/reactive-counter/` |

Browse all examples in [`examples/`](./examples/) and [`src/examples/`](./src/examples/).

## Documentation

| Resource | Link |
|---|---|
| Getting Started | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Framework Architecture | [FRAMEWORK.md](./FRAMEWORK.md) |
| Core API Reference | [docs/core/praxis-core-api.md](./docs/core/praxis-core-api.md) |
| Extending Praxis | [docs/core/extending-praxis-core.md](./docs/core/extending-praxis-core.md) |
| Svelte Integration | [docs/guides/svelte-integration.md](./docs/guides/svelte-integration.md) |
| CodeCanvas Guide | [docs/guides/canvas.md](./docs/guides/canvas.md) |
| Decision Ledger | [docs/decision-ledger/DOGFOODING.md](./docs/decision-ledger/DOGFOODING.md) |
| Tutorials | [docs/tutorials/](./docs/tutorials/) |
| Migration from 1.x | [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) |
| Roadmap | [ROADMAP.md](./ROADMAP.md) |
| 1.x Archive | [docs/archive/1.x/](./docs/archive/1.x/) |

## Development

```bash
npm install          # Install dependencies
npm run build        # Build (ESM + CJS via tsup)
npm test             # Run tests (Vitest)
npm run typecheck    # Type-check
```

## Contributing

PRs and discussions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

- 🐛 [Report a bug](https://github.com/plures/praxis/issues/new?template=bug_report.yml)
- 💡 [Request a feature](https://github.com/plures/praxis/issues/new?template=enhancement.yml)
- 🔒 [Report a security issue](./SECURITY.md)

## License

[MIT](./LICENSE)

---

**Praxis** — practical, provable, portable application logic.

Built with ❤️ by the [Plures](https://github.com/plures) team
