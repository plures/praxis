[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formatReleaseNotes

# Function: formatReleaseNotes()

> **formatReleaseNotes**(`diffs`): `string`

Defined in: src/chronos/diff.ts:230

Aggregate multiple diffs into release notes.

## Parameters

### diffs

[`RegistryDiff`](../interfaces/RegistryDiff.md)[]

Array of registry diffs to aggregate (e.g. one per merged PR)

## Returns

`string`

A markdown string summarizing all added, removed, and modified rules across the diffs
