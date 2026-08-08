[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / diffExpectations

# Function: diffExpectations()

> **diffExpectations**(`before`, `after`): [`ExpectationDiff`](../interfaces/ExpectationDiff.md)

Defined in: src/chronos/diff.ts:146

Compare expectation satisfaction between two snapshots.

## Parameters

### before

[`ExpectationSnapshot`](../interfaces/ExpectationSnapshot.md)

The baseline expectation snapshot

### after

[`ExpectationSnapshot`](../interfaces/ExpectationSnapshot.md)

The current expectation snapshot

## Returns

[`ExpectationDiff`](../interfaces/ExpectationDiff.md)

An [ExpectationDiff](../interfaces/ExpectationDiff.md) listing newly satisfied, newly violated, and unchanged expectations
