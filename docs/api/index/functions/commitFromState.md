[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / commitFromState

# Function: commitFromState()

> **commitFromState**(`diff`): `string`

Defined in: src/project/project.ts:252

Generate a conventional commit message from a behavioral delta.

Unlike file-based commit messages, this describes WHAT behavioral
changes occurred — rule additions, contract changes, expectation shifts.

## Parameters

### diff

[`PraxisDiff`](../interfaces/PraxisDiff.md)

The behavioral diff describing added, removed, and modified rules/contracts/expectations

## Returns

`string`

A conventional commit message string (e.g. `"feat(rules): add auth/login"`)

## Example

```ts
const msg = commitFromState({
  rulesAdded: ['auth/login', 'auth/logout'],
  contractsAdded: ['auth/login'],
  ...empty
});
// → "feat(rules): add auth/login, auth/logout\n\nContracts added: auth/login"
```
