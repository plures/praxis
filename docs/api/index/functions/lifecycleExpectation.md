[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / lifecycleExpectation

# Function: lifecycleExpectation()

> **lifecycleExpectation**(`id`): [`ExpectationBuilder`](../classes/ExpectationBuilder.md)

Defined in: src/lifecycle/expectation.ts:127

Create a lifecycle expectation — the single entry point for all work.

## Parameters

### id

`string`

Unique identifier for this expectation (e.g. `'user-oauth-flow'`)

## Returns

[`ExpectationBuilder`](../classes/ExpectationBuilder.md)

A chainable [ExpectationBuilder](../classes/ExpectationBuilder.md) to add type, title, description, and acceptance criteria

## Example

```ts
const auth = expectation('user-oauth-flow')
  .type('feature')
  .title('OAuth2 Authentication')
  .describe('Users can authenticate via OAuth2 providers')
  .priority('high')
  .given('a valid OAuth token')
    .when('login is attempted')
    .then('session is created')
  .accept('Error shown for invalid tokens')
  .build();
```
