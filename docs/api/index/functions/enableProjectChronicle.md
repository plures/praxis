[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / enableProjectChronicle

# Function: enableProjectChronicle()

> **enableProjectChronicle**\<`TContext`\>(`registry`, `engine`, `options?`): [`ChronicleHandle`](../interfaces/ChronicleHandle.md)

Defined in: src/chronos/hooks.ts:57

Enable project-level chronicle recording.

Wraps registry's `registerRule`, `registerModule` and engine's `step`,
`checkConstraints` methods to automatically record events.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry to instrument for auto-recording

### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

The logic engine to instrument for step and constraint recording

### options?

[`EnableChronicleOptions`](../interfaces/EnableChronicleOptions.md) = `{}`

Chronicle options: existing chronicle instance and feature toggles

## Returns

[`ChronicleHandle`](../interfaces/ChronicleHandle.md)

A handle with the chronicle and a `disconnect()` to undo all hooks.

## Example

```ts
const { chronicle, disconnect } = enableProjectChronicle(registry, engine);
registry.registerRule(myRule); // auto-recorded
engine.step(events);          // step results auto-recorded
console.log(chronicle.size);  // number of events recorded
disconnect();                 // stop recording
```
