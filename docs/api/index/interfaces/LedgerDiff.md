[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LedgerDiff

# Interface: LedgerDiff

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:267

Diff between two analysis reports

## Properties

### afterTimestamp

> **afterTimestamp**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:273

After report timestamp

***

### beforeTimestamp

> **beforeTimestamp**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:271

Before report timestamp

***

### changes

> **changes**: [`LedgerDiffEntry`](LedgerDiffEntry.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:275

Changes found

***

### scoreDelta

> **scoreDelta**: `number`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:277

Score change

***

### summary

> **summary**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:279

Summary

***

### timestamp

> **timestamp**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:269

Timestamp of the diff
