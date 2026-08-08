[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / orchestrateVersionBump

# Function: orchestrateVersionBump()

> **orchestrateVersionBump**(`rootDir`, `currentVersion`, `expectations`, `config?`, `opts?`): `VersionOrchestrationResult`

Defined in: src/lifecycle/version.ts:544

Orchestrate a full version bump: calculate → bump → sync → changelog → tag.

Does NOT execute git operations — returns the tag name for the caller.

## Parameters

### rootDir

`string`

Root directory of the project

### currentVersion

`string`

The current version string (e.g. `"1.2.3"`)

### expectations

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)[]

Lifecycle expectations to determine bump type and changelog content

### config?

[`VersioningConfig`](../interfaces/VersioningConfig.md)

Optional versioning configuration (prerelease tag, files to sync, etc.)

### opts?

Optional overrides: `prerelease`, `prereleaseTag`, `prereleaseNumber`, `dryRun`

#### dryRun?

`boolean`

#### prerelease?

`boolean`

#### prereleaseNumber?

`number`

#### prereleaseTag?

`string`

## Returns

`VersionOrchestrationResult`

A VersionOrchestrationResult with bump details, file sync results, changelog, and git tag name
