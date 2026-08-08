[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisModule

# Interface: PraxisModule\<TContext\>

Defined in: packages/praxis-core/src/rules.ts:109

A Praxis module bundles rules and constraints.
Modules can be composed and registered with the engine.

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### constraints

> **constraints**: [`ConstraintDescriptor`](ConstraintDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/rules.ts:113

Constraints in this module

***

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/rules.ts:115

Optional module metadata

***

### rules

> **rules**: [`RuleDescriptor`](RuleDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/rules.ts:111

Rules in this module
