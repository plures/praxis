[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / analyzeDependencyGraph

# Function: analyzeDependencyGraph()

> **analyzeDependencyGraph**\<`TContext`\>(`registry`): [`DependencyGraph`](../interfaces/DependencyGraph.md)

Defined in: packages/praxis-core/src/decision-ledger/analyzer.ts:45

Build the fact dependency graph from a registry.

This runs each rule with synthetic probe events to discover which facts
it reads from state and which facts it produces. For static analysis we
inspect rule metadata, contracts, event types, and probe execution.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules and constraints

## Returns

[`DependencyGraph`](../interfaces/DependencyGraph.md)

A [DependencyGraph](../interfaces/DependencyGraph.md) mapping facts, edges, producers, and consumers
