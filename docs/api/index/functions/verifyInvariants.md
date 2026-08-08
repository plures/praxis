[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / verifyInvariants

# Function: verifyInvariants()

> **verifyInvariants**\<`TContext`\>(`registry`): [`InvariantCheck`](../interfaces/InvariantCheck.md)[]

Defined in: packages/praxis-core/src/decision-ledger/contract-verification.ts:99

Check that stated invariants hold across all rules.

For each rule with a contract, check if the invariants are consistent
with the rule's behavior description and examples.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules with contracts

## Returns

[`InvariantCheck`](../interfaces/InvariantCheck.md)[]

Array of [InvariantCheck](../interfaces/InvariantCheck.md) objects, one per invariant per rule
