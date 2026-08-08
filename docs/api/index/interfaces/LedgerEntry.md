[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LedgerEntry

# Interface: LedgerEntry

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:17

A single entry in the behavior ledger.

## Properties

### author

> **author**: `string`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:25

Author or system that created this entry

***

### contract

> **contract**: [`Contract`](Contract.md)

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:27

The contract being recorded

***

### id

> **id**: `string`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:19

Unique identifier for this ledger entry

***

### reason?

> `optional` **reason?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:31

Reason for this entry (e.g., 'initial', 'assumption-revised', 'behavior-updated')

***

### status

> **status**: [`LedgerEntryStatus`](../type-aliases/LedgerEntryStatus.md)

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:23

Status of this entry

***

### supersedes?

> `optional` **supersedes?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:29

ID of the entry this supersedes (if any)

***

### timestamp

> **timestamp**: `string`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:21

Timestamp of entry creation
