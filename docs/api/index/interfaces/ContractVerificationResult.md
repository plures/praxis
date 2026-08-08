[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ContractVerificationResult

# Interface: ContractVerificationResult

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:155

Contract verification result for a single rule

## Properties

### allPassed

> **allPassed**: `boolean`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:160

Whether all examples passed

***

### examples

> **examples**: [`ExampleVerification`](ExampleVerification.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:158

Example verification results

***

### failCount

> **failCount**: `number`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:164

Number of failing examples

***

### passCount

> **passCount**: `number`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:162

Number of passing examples

***

### ruleId

> **ruleId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:156
