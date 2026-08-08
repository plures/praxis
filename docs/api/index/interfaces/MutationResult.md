[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / MutationResult

# Interface: MutationResult

Defined in: src/unified/types.ts:91

Result returned by `app.mutate()` — accepted status, violations, and emitted facts.

## Properties

### accepted

> **accepted**: `boolean`

Defined in: src/unified/types.ts:93

Whether the mutation was accepted

***

### facts

> **facts**: [`PraxisFact`](PraxisFact.md)[]

Defined in: src/unified/types.ts:97

Facts emitted by rules triggered by this mutation

***

### violations

> **violations**: [`PraxisDiagnostics`](PraxisDiagnostics.md)[]

Defined in: src/unified/types.ts:95

Constraint violations that blocked the mutation (if any)
