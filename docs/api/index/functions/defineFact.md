[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineFact

# Function: defineFact()

> **defineFact**\<`TTag`, `TPayload`\>(`tag`): [`FactDefinition`](../interfaces/FactDefinition.md)\<`TTag`, `TPayload`\>

Defined in: src/dsl/index.ts:40

Define a typed fact

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Parameters

### tag

`TTag`

The fact type tag (e.g. `"UserLoggedIn"`) — must be a string literal type for full type safety

## Returns

[`FactDefinition`](../interfaces/FactDefinition.md)\<`TTag`, `TPayload`\>

A [FactDefinition](../interfaces/FactDefinition.md) with `create()` and `is()` helpers

## Example

```ts
const UserLoggedIn = defineFact<"UserLoggedIn", { userId: string }>("UserLoggedIn");
const fact = UserLoggedIn.create({ userId: "123" });
if (UserLoggedIn.is(fact)) {
  console.log(fact.payload.userId); // Type-safe!
}
```
