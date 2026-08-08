[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / RuleEffectivenessReport

# Interface: RuleEffectivenessReport

Defined in: src/analysis/index.ts:72

Metrics about which rules are active, dormant, or producing no-ops.

## Properties

### activeRules

> **activeRules**: `number`

Defined in: src/analysis/index.ts:74

***

### byFrequency

> **byFrequency**: `object`[]

Defined in: src/analysis/index.ts:77

Rules sorted by fire frequency

#### fires

> **fires**: `number`

#### lastFired

> **lastFired**: `string`

#### ruleId

> **ruleId**: `string`

***

### constraintViolations

> **constraintViolations**: `object`[]

Defined in: src/analysis/index.ts:81

Constraint violations over time

#### constraintId

> **constraintId**: `string`

#### count

> **count**: `number`

#### lastViolation

> **lastViolation**: `string`

***

### dormantRules

> **dormantRules**: `number`

Defined in: src/analysis/index.ts:75

***

### noopRules

> **noopRules**: `string`[]

Defined in: src/analysis/index.ts:79

Rules that fire but never produce observable effects

***

### totalRules

> **totalRules**: `number`

Defined in: src/analysis/index.ts:73
