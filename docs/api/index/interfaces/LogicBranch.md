[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LogicBranch

# Interface: LogicBranch

Defined in: packages/praxis-core/src/completeness.ts:75

A conditional branch in application logic — domain, invariant, UI, etc.

## Properties

### condition

> **condition**: `string`

Defined in: packages/praxis-core/src/completeness.ts:79

The condition expression

***

### coveredBy

> **coveredBy**: `string` \| `null`

Defined in: packages/praxis-core/src/completeness.ts:83

If domain/invariant: the Praxis rule/constraint that covers it, or null

***

### kind

> **kind**: `"domain"` \| `"invariant"` \| `"ui"` \| `"transport"` \| `"wiring"` \| `"transform"`

Defined in: packages/praxis-core/src/completeness.ts:81

Classification

***

### location

> **location**: `string`

Defined in: packages/praxis-core/src/completeness.ts:77

Source file + line

***

### note?

> `optional` **note?**: `string`

Defined in: packages/praxis-core/src/completeness.ts:85

Human note
