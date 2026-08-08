[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / expectBehavior

# Function: expectBehavior()

> **expectBehavior**(`name`): [`Expectation`](../classes/Expectation.md)

Defined in: src/expectations/expectations.ts:130

Create a new behavioral expectation.

## Parameters

### name

`string`

Unique name for this expectation (e.g. `'settings-saved-toast'`)

## Returns

[`Expectation`](../classes/Expectation.md)

A chainable [Expectation](../classes/Expectation.md) builder with `onlyWhen()`, `never()`, and `always()` methods

## Example

```ts
expectBehavior('settings-saved-toast')
  .onlyWhen('settings.diff is non-empty')
  .never('when save fails')
  .always('includes which settings changed');
```
