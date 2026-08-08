[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / diffRegistries

# Function: diffRegistries()

> **diffRegistries**(`before`, `after`): [`RegistryDiff`](../interfaces/RegistryDiff.md)

Defined in: src/chronos/diff.ts:78

Compare two registry snapshots.

Detects rules/constraints that were added, removed, or modified
(description or contract changed).

## Parameters

### before

[`RegistrySnapshot`](../interfaces/RegistrySnapshot.md)

The baseline registry snapshot

### after

[`RegistrySnapshot`](../interfaces/RegistrySnapshot.md)

The current registry snapshot

## Returns

[`RegistryDiff`](../interfaces/RegistryDiff.md)

A [RegistryDiff](../interfaces/RegistryDiff.md) with lists of added, removed, and modified rules and constraints
