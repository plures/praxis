[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Gap

# Interface: Gap

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:111

An expected behavior with no covering rule

## Properties

### description

> **description**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:115

What's missing

***

### expectationName

> **expectationName**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:113

The expectation name

***

### partialCoverage

> **partialCoverage**: `string`[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:117

Related rule IDs that partially cover

***

### type

> **type**: `"no-rule"` \| `"partial-coverage"` \| `"no-contract"`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:119

The type of gap
