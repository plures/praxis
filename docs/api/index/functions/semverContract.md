[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / semverContract

# Function: semverContract()

> **semverContract**(`config`): [`PraxisModule`](../interfaces/PraxisModule.md)

Defined in: src/project/project.ts:175

Create a semver contract module that checks version consistency
across multiple sources (package.json, Cargo.toml, etc.).

## Parameters

### config

[`SemverContractConfig`](../interfaces/SemverContractConfig.md)

Configuration with `sources` (list of files) and `invariants` to enforce

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)

A [PraxisModule](../interfaces/PraxisModule.md) with a version-check rule and consistency constraint

## Example

```ts
const version = semverContract({
  sources: ['package.json', 'src/version.ts', 'README.md'],
  invariants: ['All sources must have the same version'],
});
```
