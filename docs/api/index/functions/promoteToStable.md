[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / promoteToStable

# Function: promoteToStable()

> **promoteToStable**(`version`): [`SemverVersion`](../interfaces/SemverVersion.md)

Defined in: src/lifecycle/version.ts:196

Promote a prerelease to stable (strip prerelease/build metadata).

## Parameters

### version

[`SemverVersion`](../interfaces/SemverVersion.md)

The prerelease version to promote (e.g. `1.2.0-rc.3`)

## Returns

[`SemverVersion`](../interfaces/SemverVersion.md)

A stable [SemverVersion](../interfaces/SemverVersion.md) with prerelease and build metadata removed
