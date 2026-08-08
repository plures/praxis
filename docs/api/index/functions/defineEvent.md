[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineEvent

# Function: defineEvent()

> **defineEvent**\<`TTag`, `TPayload`\>(`tag`): [`EventDefinition`](../interfaces/EventDefinition.md)\<`TTag`, `TPayload`\>

Defined in: src/dsl/index.ts:73

Define a typed event

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Parameters

### tag

`TTag`

The event type tag (e.g. `"LOGIN"`) — must be a string literal type for full type safety

## Returns

[`EventDefinition`](../interfaces/EventDefinition.md)\<`TTag`, `TPayload`\>

An [EventDefinition](../interfaces/EventDefinition.md) with `create()` and `is()` helpers

## Example

```ts
const Login = defineEvent<"LOGIN", { username: string; password: string }>("LOGIN");
const event = Login.create({ username: "alice", password: "secret" });
```
