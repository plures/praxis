[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / traceDerivation

# Function: traceDerivation()

> **traceDerivation**\<`TContext`\>(`factTag`, `_engine`, `registry`): [`DerivationChain`](../interfaces/DerivationChain.md)

Defined in: packages/praxis-core/src/decision-ledger/derivation.ts:26

Trace how a fact was derived through the rule chain.

Starting from the fact tag, walks backward through the dependency graph
to find the full derivation chain: event → rule A → fact X → rule B → fact Y

Uses the engine's current state to identify which rules actually fired.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### factTag

`string`

The fact type tag to trace backwards from

### \_engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

The logic engine (used for current state introspection)

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules

## Returns

[`DerivationChain`](../interfaces/DerivationChain.md)

A [DerivationChain](../interfaces/DerivationChain.md) showing the complete derivation path to the fact
