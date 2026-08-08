[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CrossReference

# Interface: CrossReference

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:189

Cross-reference result

## Properties

### producerRuleId

> **producerRuleId**: `string` \| `null`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:195

The rule that produces the referenced fact (or null if missing)

***

### referencedFactTag

> **referencedFactTag**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:193

The referenced fact tag

***

### sourceRuleId

> **sourceRuleId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:191

Rule whose contract references another rule's facts

***

### valid

> **valid**: `boolean`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:197

Whether the producer exists
