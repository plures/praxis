[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisAppConfig

# Interface: PraxisAppConfig

Defined in: src/unified/types.ts:143

Configuration passed to `createApp()` — schema, rules, constraints, and liveness options.

## Properties

### chronos?

> `optional` **chronos?**: `object`

Defined in: src/unified/types.ts:155

Chronos options

#### batchMs?

> `optional` **batchMs?**: `number`

#### maxBatch?

> `optional` **maxBatch?**: `number`

***

### constraints?

> `optional` **constraints?**: [`UnifiedConstraint`](UnifiedConstraint.md)[]

Defined in: src/unified/types.ts:151

Constraints

***

### liveness?

> `optional` **liveness?**: [`LivenessConfig`](LivenessConfig.md)

Defined in: src/unified/types.ts:153

Liveness monitoring

***

### name

> **name**: `string`

Defined in: src/unified/types.ts:145

App name (used in Chronos context)

***

### rules?

> `optional` **rules?**: [`UnifiedRule`](UnifiedRule.md)[]

Defined in: src/unified/types.ts:149

Business rules

***

### schema

> **schema**: [`PathSchema`](PathSchema.md)\<`unknown`\>[]

Defined in: src/unified/types.ts:147

Graph schema — all paths the app uses
