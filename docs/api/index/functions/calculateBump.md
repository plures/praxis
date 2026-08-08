[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / calculateBump

# Function: calculateBump()

> **calculateBump**(`expectations`): `object`

Defined in: src/lifecycle/version.ts:101

Calculate the semver bump type from a set of expectations.
Returns the highest bump needed.

## Parameters

### expectations

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)[]

Array of lifecycle expectations to examine for breaking/feature/fix markers

## Returns

`object`

The required `BumpType` and an array of reasons explaining each expectation's contribution

### bump

> **bump**: [`BumpType`](../type-aliases/BumpType.md)

### reasons

> **reasons**: `string`[]
