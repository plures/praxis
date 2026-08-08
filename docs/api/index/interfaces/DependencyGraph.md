[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DependencyGraph

# Interface: DependencyGraph

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:28

The full dependency graph

## Properties

### consumers

> **consumers**: `Map`\<`string`, `string`[]\>

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:36

Rule IDs that consume facts

***

### edges

> **edges**: [`DependencyEdge`](DependencyEdge.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:32

All edges

***

### facts

> **facts**: `Map`\<`string`, [`FactNode`](FactNode.md)\>

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:30

Fact nodes keyed by tag

***

### producers

> **producers**: `Map`\<`string`, `string`[]\>

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:34

Rule IDs that produce facts
