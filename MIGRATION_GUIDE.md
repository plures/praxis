# Migrating to Praxis 2.0

This guide covers the key changes from Praxis 1.x to 2.0 and how to upgrade.

## What Changed

### New: Unified Reactive Layer (`createApp`)

Praxis 2.0 introduces a zero-boilerplate API for building reactive applications. Instead of manually wiring registries, engines, and adapters, you call `createApp()`:

```ts
import { createApp, definePath, defineRule, defineConstraint, RuleResult, fact } from '@plures/praxis/unified';

const app = createApp({
  name: 'my-app',
  schema: [definePath<number>('count', 0)],
  rules: [
    defineRule({
      id: 'count.doubled',
      watch: ['count'],
      evaluate: (v) => RuleResult.emit([fact('count.doubled', { value: v['count'] * 2 })]),
    }),
  ],
});

app.mutate('count', 5);
app.query('count').current; // 5
```

The classic engine API (`createPraxisEngine`, `PraxisRegistry`, `defineFact`, `defineEvent`, `defineRule`) is still fully supported and unchanged.

### New: RuleResult Class

Rules can now return typed results instead of raw arrays:

```ts
import { RuleResult } from '@plures/praxis';

// Before (1.x) — still works
return [UserLoggedIn.create({ userId: 'alice' })];
return [];

// New (2.0) — explicit intent
return RuleResult.emit([UserLoggedIn.create({ userId: 'alice' })]);
return RuleResult.noop('No matching event');
return RuleResult.skip('Precondition not met');
return RuleResult.retract(['session.expired']);
```

### New: Decision Ledger & Contracts

Every rule and constraint can now carry an explicit behavioral contract:

```ts
import { defineContract, defineRule } from '@plures/praxis';

const loginContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Authenticate user and create session',
  examples: [{ given: 'Valid credentials', when: 'LOGIN event', then: 'Session fact emitted' }],
  invariants: ['Session must have unique ID'],
});

const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login',
  impl: (state, events) => { /* ... */ },
  contract: loginContract,
});
```

### New: Additional Export Paths

Praxis 2.0 adds several new subpath exports:

| Import path | New in 2.0 | Description |
|---|---|---|
| `@plures/praxis/unified` | ✅ | Unified reactive layer |
| `@plures/praxis/expectations` | ✅ | Behavior expectation DSL |
| `@plures/praxis/factory` | ✅ | Pre-built UI rule modules |
| `@plures/praxis/project` | ✅ | Project gates and lifecycle |
| `@plures/praxis/mcp` | ✅ | Model Context Protocol tools |

Existing import paths (`.`, `./svelte`, `./schema`, `./component`, `./cloud`, `./components`) continue to work unchanged.

### PluresDB: Official NPM Package

Praxis now uses the official `pluresdb` package from npm instead of the built-in adapter:

```ts
// Before (1.x)
import { createInMemoryDB } from '@plures/praxis';

// After (2.0) — for production
import { PluresNode } from 'pluresdb';
import { createPluresDB } from '@plures/praxis';

const db = createPluresDB(new PluresNode({ config: { port: 34567, dataDir: './data' }, autoStart: true }));
```

The in-memory adapter (`createInMemoryDB`) is still available for development and testing.

## Upgrade Steps

### 1. Update the package

```bash
npm install @plures/praxis@latest
```

### 2. No breaking changes

All 1.x APIs continue to work. You do not need to change existing code.

### 3. Adopt new features incrementally

- Try `createApp()` for new features or simpler modules
- Add `contract` to existing rules for behavior documentation
- Use `RuleResult` for clearer rule return values
- Run `npm run scan:rules` and `npm run validate:contracts` for the Decision Ledger

## Import Patterns

All existing import patterns continue to work:

```ts
// Main package — unchanged
import { createPraxisEngine, defineRule, defineFact } from '@plures/praxis';

// Svelte integration — unchanged
import { usePraxisEngine } from '@plures/praxis/svelte';

// Schema types — unchanged
import type { PraxisSchema } from '@plures/praxis/schema';

// Cloud integration — unchanged
import { connectRelay } from '@plures/praxis/cloud';
```

## FAQ

**Q: Do I need to rewrite my 1.x code?**
No. All 1.x APIs are preserved. Adopt 2.0 features at your own pace.

**Q: Is `createApp()` a replacement for `createPraxisEngine()`?**
It's an alternative for simpler use cases. Use `createPraxisEngine()` when you need typed events, actors, or fine-grained control.

**Q: Are bundle sizes affected?**
Use the new subpath exports (`/unified`, `/factory`, etc.) for smaller bundles via tree-shaking.

## References

- [README.md](./README.md) — full 2.0 documentation
- [Getting Started](./GETTING_STARTED.md) — quick start for new users
- [FRAMEWORK.md](./FRAMEWORK.md) — architecture overview
- [CHANGELOG.md](./CHANGELOG.md) — version history
