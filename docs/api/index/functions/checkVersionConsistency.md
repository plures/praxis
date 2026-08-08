[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / checkVersionConsistency

# Function: checkVersionConsistency()

> **checkVersionConsistency**(`rootDir`, `files`): `object`

Defined in: src/lifecycle/version.ts:387

Check version consistency across files.

## Parameters

### rootDir

`string`

Root directory of the project

### files

`string`[]

List of file paths to check (relative to `rootDir`)

## Returns

`object`

An object with `consistent` flag, per-file `versions`, and a list of `conflicts`

### conflicts

> **conflicts**: `string`[]

### consistent

> **consistent**: `boolean`

### versions

> **versions**: `Record`\<`string`, `string` \| `null`\>
