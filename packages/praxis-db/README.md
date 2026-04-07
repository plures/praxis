# @plures/praxis-db

PluresDB-backed persistence for [@plures/praxis-core](../praxis-core/).

## Architecture

```
praxis-core (LogicEngine)  ←→  praxis-db (PraxisDBEngine)  ←→  PluresDB (CRDT + Agens)
      ↑ pure in-memory              ↑ persistence bridge             ↑ Rust native
```

**praxis-core** provides the pure, in-memory logic engine with rules, constraints, and facts. It has zero dependencies and runs anywhere.

**praxis-db** wraps the engine with PluresDB persistence. Every `step()` call automatically:
1. Persists facts to PluresDB CRDT nodes
2. Stores events in the append-only CRDT log
3. Emits Agens events for reactive subscribers (pluresLM, pares-agens)
4. Exposes the PluresDB state table for cross-system reactivity

## Quick Start

```ts
import { PluresDatabase } from '@plures/pluresdb';
import { PraxisRegistry } from '@plures/praxis-core';
import { PraxisDBEngine } from '@plures/praxis-db';

const db = new PluresDatabase('praxis', './data');
const registry = new PraxisRegistry();

// Add rules and constraints to registry...

const engine = new PraxisDBEngine({
  initialContext: { project: 'my-app' },
  registry,
  db: { db },
});

await engine.init(); // Restores persisted facts from PluresDB

const result = engine.step([
  { tag: 'deploy.started', payload: { env: 'production' } },
]);
// Facts + events are now in PluresDB, syncing via Hyperswarm
```

## Agens Integration

The adapter exposes PluresDB's Agens reactive runtime:

```ts
// Reactive state
engine.db.stateSet('deployment.status', 'in-progress');
const status = engine.db.stateGet('deployment.status');

// Timers
const timerId = engine.db.scheduleTimer('health-check', 60, { target: 'prod' });

// Events
const events = engine.db.listEvents('2026-04-05T00:00:00Z');
```

## Design Principle

> TypeScript is the authoring language. PluresDB is the runtime.

The core engine stays pure and testable. This package adds persistence without changing the engine's API. If you don't need persistence, use `@plures/praxis-core` directly.
