[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / applyBump

# Function: applyBump()

> **applyBump**(`current`, `bump`, `prerelease?`): [`SemverVersion`](../interfaces/SemverVersion.md)

Defined in: src/lifecycle/version.ts:137

Apply a bump to a version, producing the next version.

## Parameters

### current

[`SemverVersion`](../interfaces/SemverVersion.md)

The current semver version

### bump

[`BumpType`](../type-aliases/BumpType.md)

The bump type to apply (`'major'`, `'minor'`, `'patch'`, or `'none'`)

### prerelease?

Optional prerelease tag and increment number (e.g. `{ tag: 'rc', increment: 1 }`)

#### increment?

`number`

#### tag

`string`

## Returns

[`SemverVersion`](../interfaces/SemverVersion.md)

The new [SemverVersion](../interfaces/SemverVersion.md) after applying the bump
