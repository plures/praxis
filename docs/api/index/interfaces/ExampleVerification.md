[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExampleVerification

# Interface: ExampleVerification

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:139

Result of running a contract example against its rule

## Properties

### actualOutput?

> `optional` **actualOutput?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:149

Actual output if different

***

### error?

> `optional` **error?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:151

Error if execution failed

***

### expectedThen

> **expectedThen**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:145

***

### given

> **given**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:143

Given/When/Then description

***

### index

> **index**: `number`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:141

The example index

***

### passed

> **passed**: `boolean`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:147

Whether it passed

***

### when

> **when**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:144
