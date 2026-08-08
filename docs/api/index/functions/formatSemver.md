[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formatSemver

# Function: formatSemver()

> **formatSemver**(`v`, `prefix?`): `string`

Defined in: src/lifecycle/version.ts:85

Format a [SemverVersion](../interfaces/SemverVersion.md) back into a version string, optionally prefixed with `"v"`.

## Parameters

### v

[`SemverVersion`](../interfaces/SemverVersion.md)

The semver version object to format

### prefix?

`boolean` = `false`

When `true`, prepends `"v"` to the output (e.g. `"v1.2.3"`)

## Returns

`string`

A semver-formatted string
