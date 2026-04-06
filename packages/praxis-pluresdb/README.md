# @plures/praxis-pluresdb

PluresDB native backend for the Praxis logic engine.

## What this does

Replaces the in-memory/polling PraxisDB adapter with PluresDB's native NAPI bindings:

- **`PluresDBNativeAdapter`** — implements the `PraxisDB` interface using direct NAPI calls instead of HTTP or polling
- **`executeProcedure`** — translates pluresLM-mcp TypeScript procedure steps into PluresDB IR and runs them natively in Rust
- **`executeConstraints`** — evaluates Praxis constraints as PluresDB procedure pipelines
- **`canExecuteNatively`** — checks if a procedure can bypass the TS engine entirely

## Usage

```typescript
import { PluresDatabase } from '@plures/pluresdb';
import { PluresDBNativeAdapter, executeProcedure } from '@plures/praxis-pluresdb';

const db = new PluresDatabase('my-actor', './data');
const adapter = new PluresDBNativeAdapter({ db });

// Use as PraxisDB
await adapter.set('/_praxis/facts/user/1', { tag: 'User', payload: { name: 'Alice' } });
const user = await adapter.get('/_praxis/facts/user/1');

// Execute procedures natively
const result = executeProcedure(db, [
  { kind: 'search', params: { query: 'authentication', limit: 5 } },
  { kind: 'filter', params: { field: 'category', op: 'eq', value: 'decision' } },
]);
```

## Architecture

```
praxis-core (logic)  ←→  praxis-pluresdb (bridge)  ←→  PluresDB NAPI (Rust)
                                                           ↓
                                                    Procedure Engine
                                                    HNSW Vector Index
                                                    CRDT Store
                                                    AgensRuntime
```
