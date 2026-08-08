[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisApp

# Interface: PraxisApp

Defined in: src/unified/core.ts:63

The live app instance returned by `createApp()` — query, mutate, inspect, and destroy.

## Properties

### batch

> **batch**: (`fn`) => [`MutationResult`](MutationResult.md)

Defined in: src/unified/core.ts:69

Batch multiple mutations atomically

#### Parameters

##### fn

(`mutate`) => `void`

#### Returns

[`MutationResult`](MutationResult.md)

***

### destroy

> **destroy**: () => `void`

Defined in: src/unified/core.ts:79

Cleanup

#### Returns

`void`

***

### evaluate

> **evaluate**: () => `void`

Defined in: src/unified/core.ts:77

Force re-evaluate all rules

#### Returns

`void`

***

### facts

> **facts**: () => [`PraxisFact`](PraxisFact.md)[]

Defined in: src/unified/core.ts:71

Current facts

#### Returns

[`PraxisFact`](PraxisFact.md)[]

***

### liveness

> **liveness**: () => `Record`\<`string`, \{ `elapsed`: `number`; `lastUpdated`: `number`; `stale`: `boolean`; \}\>

Defined in: src/unified/core.ts:81

Liveness status — which paths are stale

#### Returns

`Record`\<`string`, \{ `elapsed`: `number`; `lastUpdated`: `number`; `stale`: `boolean`; \}\>

***

### mutate

> **mutate**: (`path`, `value`) => [`MutationResult`](MutationResult.md)

Defined in: src/unified/core.ts:67

Write to the graph — validates through constraints first

#### Parameters

##### path

`string`

##### value

`unknown`

#### Returns

[`MutationResult`](MutationResult.md)

***

### query

> **query**: \<`T`\>(`path`, `opts?`) => [`ReactiveRef`](ReactiveRef.md)\<`T`\>

Defined in: src/unified/core.ts:65

Reactive query — returns a Svelte-compatible store

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### opts?

[`QueryOptions`](QueryOptions.md)\<`T`\>

#### Returns

[`ReactiveRef`](ReactiveRef.md)\<`T`\>

***

### timeline

> **timeline**: () => `TimelineEntry`[]

Defined in: src/unified/core.ts:75

Timeline (Chronos entries)

#### Returns

`TimelineEntry`[]

***

### violations

> **violations**: () => [`PraxisDiagnostics`](PraxisDiagnostics.md)[]

Defined in: src/unified/core.ts:73

Current constraint violations

#### Returns

[`PraxisDiagnostics`](PraxisDiagnostics.md)[]
