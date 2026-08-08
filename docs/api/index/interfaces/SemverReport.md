[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / SemverReport

# Interface: SemverReport

Defined in: src/project/types.ts:46

Result of a semantic version consistency check.

## Properties

### consistent

> **consistent**: `boolean`

Defined in: src/project/types.ts:48

Whether all sources have consistent versions

***

### versions

> **versions**: `Record`\<`string`, `string`\>

Defined in: src/project/types.ts:50

Version found in each source

***

### violations

> **violations**: `string`[]

Defined in: src/project/types.ts:52

Invariant violations
