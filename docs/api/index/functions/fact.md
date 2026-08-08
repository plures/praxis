[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / fact

# Function: fact()

> **fact**(`tag`, `payload`): [`PraxisFact`](../interfaces/PraxisFact.md)

Defined in: packages/praxis-core/src/rule-result.ts:137

Convenience helper to create a typed fact object.

Shorthand for `{ tag, payload }` used inside `RuleResult.emit()` calls.

## Parameters

### tag

`string`

The fact type tag (e.g. `'sprint.behind'`)

### payload

`unknown`

The fact payload data

## Returns

[`PraxisFact`](../interfaces/PraxisFact.md)

A [PraxisFact](../interfaces/PraxisFact.md) with the given tag and payload

## Example

```ts
return RuleResult.emit([fact('sprint.behind', { deficit: 3 })]);
```
