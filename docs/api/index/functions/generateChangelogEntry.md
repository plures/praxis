[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateChangelogEntry

# Function: generateChangelogEntry()

> **generateChangelogEntry**(`version`, `expectations`, `date?`): [`ChangelogEntry`](../interfaces/ChangelogEntry.md)

Defined in: src/lifecycle/version.ts:432

Generate a changelog entry from expectations.

## Parameters

### version

`string`

The release version string (e.g. `"2.1.0"`)

### expectations

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)[]

Lifecycle expectations to include in the changelog

### date?

`string`

Optional ISO date string (defaults to today)

## Returns

[`ChangelogEntry`](../interfaces/ChangelogEntry.md)

A [ChangelogEntry](../interfaces/ChangelogEntry.md) with categorized sections and breaking changes
