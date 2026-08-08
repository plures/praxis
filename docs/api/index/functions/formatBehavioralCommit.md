[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formatBehavioralCommit

# Function: formatBehavioralCommit()

> **formatBehavioralCommit**(`diff`): `string`

Defined in: src/chronos/diff.ts:209

Generate a conventional commit message from a registry diff.

Uses the same logic as `commitFromState` in `project/` but works
directly from a RegistryDiff.

## Parameters

### diff

[`RegistryDiff`](../interfaces/RegistryDiff.md)

The registry diff to generate a commit message from

## Returns

`string`

A conventional commit message string (e.g. `"feat(rules): add sprint.behind rule"`)
