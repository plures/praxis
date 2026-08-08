[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / syncVersions

# Function: syncVersions()

> **syncVersions**(`rootDir`, `version`, `files?`): [`VersionSyncResult`](../interfaces/VersionSyncResult.md)[]

Defined in: src/lifecycle/version.ts:345

Sync a version across multiple files.

## Parameters

### rootDir

`string`

Root directory of the project

### version

`string`

The target version string to write to all files

### files?

`string`[]

Optional list of file paths to sync (relative to `rootDir`; defaults to `['package.json']`)

## Returns

[`VersionSyncResult`](../interfaces/VersionSyncResult.md)[]

Array of [VersionSyncResult](../interfaces/VersionSyncResult.md) objects, one per target file
