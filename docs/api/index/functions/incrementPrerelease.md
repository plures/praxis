[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / incrementPrerelease

# Function: incrementPrerelease()

> **incrementPrerelease**(`version`, `tag?`): [`SemverVersion`](../interfaces/SemverVersion.md)

Defined in: src/lifecycle/version.ts:175

Increment the prerelease counter of an existing prerelease version.
e.g., 1.2.0-rc.1 → 1.2.0-rc.2

## Parameters

### version

[`SemverVersion`](../interfaces/SemverVersion.md)

The prerelease version to increment

### tag?

`string`

Optional prerelease tag to use (defaults to the existing tag, or `'rc'`)

## Returns

[`SemverVersion`](../interfaces/SemverVersion.md)

A new [SemverVersion](../interfaces/SemverVersion.md) with an incremented prerelease counter
