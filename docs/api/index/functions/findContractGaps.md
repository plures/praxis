[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findContractGaps

# Function: findContractGaps()

> **findContractGaps**\<`TContext`\>(`registry`): [`ContractCoverageGap`](../interfaces/ContractCoverageGap.md)[]

Defined in: packages/praxis-core/src/decision-ledger/contract-verification.ts:139

Find rules with contracts that don't cover all code paths.

Analyzes contract examples to find:
- Rules with only happy-path examples (no error cases)
- Rules with no boundary condition examples
- Rules that handle multiple event types but only have examples for some

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules with contracts

## Returns

[`ContractCoverageGap`](../interfaces/ContractCoverageGap.md)[]

Array of [ContractCoverageGap](../interfaces/ContractCoverageGap.md) objects for insufficiently covered contracts
