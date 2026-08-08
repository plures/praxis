[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CompletenessReport

# Interface: CompletenessReport

Defined in: packages/praxis-core/src/completeness.ts:111

Completeness audit report — coverage across rules, constraints, contracts, context, and events.

## Properties

### constraints

> **constraints**: `object`

Defined in: packages/praxis-core/src/completeness.ts:122

#### covered

> **covered**: `number`

#### total

> **total**: `number`

#### uncovered

> **uncovered**: [`LogicBranch`](LogicBranch.md)[]

***

### context

> **context**: `object`

Defined in: packages/praxis-core/src/completeness.ts:132

#### covered

> **covered**: `number`

#### missing

> **missing**: [`StateField`](StateField.md)[]

#### total

> **total**: `number`

***

### contracts

> **contracts**: `object`

Defined in: packages/praxis-core/src/completeness.ts:127

#### missing

> **missing**: `string`[]

#### total

> **total**: `number`

#### withContracts

> **withContracts**: `number`

***

### events

> **events**: `object`

Defined in: packages/praxis-core/src/completeness.ts:137

#### covered

> **covered**: `number`

#### missing

> **missing**: [`StateTransition`](StateTransition.md)[]

#### total

> **total**: `number`

***

### rating

> **rating**: `"complete"` \| `"good"` \| `"partial"` \| `"incomplete"`

Defined in: packages/praxis-core/src/completeness.ts:115

Rating

***

### rules

> **rules**: `object`

Defined in: packages/praxis-core/src/completeness.ts:117

#### covered

> **covered**: `number`

#### total

> **total**: `number`

#### uncovered

> **uncovered**: [`LogicBranch`](LogicBranch.md)[]

***

### score

> **score**: `number`

Defined in: packages/praxis-core/src/completeness.ts:113

Overall score (0-100)
