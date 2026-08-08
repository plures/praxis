[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / crossReferenceContracts

# Function: crossReferenceContracts()

> **crossReferenceContracts**\<`TContext`\>(`registry`): [`CrossReference`](../interfaces/CrossReference.md)[]

Defined in: packages/praxis-core/src/decision-ledger/contract-verification.ts:216

Find contracts that reference facts from other rules and verify
those producing rules actually exist.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules with contracts

## Returns

[`CrossReference`](../interfaces/CrossReference.md)[]

Array of [CrossReference](../interfaces/CrossReference.md) objects describing inter-rule fact dependencies
