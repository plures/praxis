[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / parseSemver

# Function: parseSemver()

> **parseSemver**(`version`): [`SemverVersion`](../interfaces/SemverVersion.md) \| `null`

Defined in: src/lifecycle/version.ts:66

Parse a semver string (e.g., `"1.2.3-rc.1"`) into a [SemverVersion](../interfaces/SemverVersion.md) object, or `null` if invalid.

## Parameters

### version

`string`

Semver string with optional `"v"` prefix (e.g. `"v2.0.0"` or `"1.2.3-rc.1"`)

## Returns

[`SemverVersion`](../interfaces/SemverVersion.md) \| `null`

Parsed [SemverVersion](../interfaces/SemverVersion.md) or `null` if the string is not a valid semver
