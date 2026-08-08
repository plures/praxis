[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisEngineOptions

# Interface: PraxisEngineOptions\<TContext\>

Defined in: packages/praxis-core/src/engine.ts:24

Options for creating a Praxis engine

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### factDedup?

> `optional` **factDedup?**: `"none"` \| `"last-write-wins"` \| `"append"`

Defined in: packages/praxis-core/src/engine.ts:40

Fact deduplication strategy (default: 'last-write-wins').

- 'none': facts accumulate without dedup (original behavior)
- 'last-write-wins': only keep the latest fact per tag (most common)
- 'append': keep all facts but cap at maxFacts

***

### initialContext

> **initialContext**: `TContext`

Defined in: packages/praxis-core/src/engine.ts:26

Initial context

***

### initialFacts?

> `optional` **initialFacts?**: [`PraxisFact`](PraxisFact.md)[]

Defined in: packages/praxis-core/src/engine.ts:30

Initial facts (optional)

***

### initialMeta?

> `optional` **initialMeta?**: `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/engine.ts:32

Initial metadata (optional)

***

### maxFacts?

> `optional` **maxFacts?**: `number`

Defined in: packages/praxis-core/src/engine.ts:46

Maximum number of facts to retain (default: 1000).
When exceeded, oldest facts are evicted (FIFO).
Set to 0 for unlimited (not recommended).

***

### pluresDbConstraintAdapter?

> `optional` **pluresDbConstraintAdapter?**: `PluresDbConstraintAdapter`

Defined in: packages/praxis-core/src/engine.ts:59

Opt-in adapter (ADR-0028) that delegates **declarative** constraints to the
canonical Rust constraint engine (`pluresdb-px`) via the `pluresdb-node`
NAPI surface (`pxOnAction`/`pxEvaluate`).

When omitted (the default), `step()` behaves exactly as before — every
constraint is checked via its TS closure `impl`. When provided, constraints
that the adapter recognizes as declarative (`meta.declarative === true`) are
evaluated by Rust and the adapter translates a Rust block (a `pxOnAction`
throw) into the standard `constraint-violation` diagnostic. TS-closure
constraints and all rules are unaffected.

***

### registry

> **registry**: [`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

Defined in: packages/praxis-core/src/engine.ts:28

Registry of rules and constraints
