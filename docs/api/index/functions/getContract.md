[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / getContract

# Function: getContract()

> **getContract**(`meta?`): [`Contract`](../interfaces/Contract.md) \| `undefined`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:180

Extract contract from rule/constraint metadata.

## Parameters

### meta?

`Record`\<`string`, `unknown`\>

The `meta` object from a rule or constraint descriptor

## Returns

[`Contract`](../interfaces/Contract.md) \| `undefined`

The attached [Contract](../interfaces/Contract.md) if present and valid, or `undefined`
