[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ValidationReport

# Interface: ValidationReport

Defined in: packages/praxis-core/src/decision-ledger/types.ts:250

Result of contract validation.

## Properties

### complete

> **complete**: `object`[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:252

Rules/constraints with complete contracts

#### contract

> **contract**: [`Contract`](Contract.md)

#### ruleId

> **ruleId**: `string`

***

### incomplete

> **incomplete**: [`ContractGap`](ContractGap.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:254

Rules/constraints with incomplete contracts

***

### missing

> **missing**: `string`[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:256

Rules/constraints with no contract at all

***

### timestamp

> **timestamp**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:260

Timestamp of validation

***

### total

> **total**: `number`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:258

Total number of rules/constraints validated
