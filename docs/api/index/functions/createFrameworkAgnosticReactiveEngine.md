[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createFrameworkAgnosticReactiveEngine

# Function: createFrameworkAgnosticReactiveEngine()

> **createFrameworkAgnosticReactiveEngine**\<`TContext`\>(`options`): [`FrameworkAgnosticReactiveEngine`](../classes/FrameworkAgnosticReactiveEngine.md)\<`TContext`\>

Defined in: packages/praxis-core/src/reactive-engine.ts:317

Create a new reactive logic engine instance.

## Type Parameters

### TContext

`TContext` *extends* `object`

## Parameters

### options

[`FrameworkAgnosticReactiveEngineOptions`](../interfaces/FrameworkAgnosticReactiveEngineOptions.md)\<`TContext`\>

Configuration options for the reactive engine

## Returns

[`FrameworkAgnosticReactiveEngine`](../classes/FrameworkAgnosticReactiveEngine.md)\<`TContext`\>

A new ReactiveLogicEngine instance

## Example

```typescript
const engine = createReactiveEngine({
  initialContext: { count: 0 },
  initialFacts: [],
  initialMeta: {}
});

// Subscribe to changes
engine.subscribe((state) => {
  console.log('State changed:', state);
});

// Mutate state (will trigger subscribers)
engine.apply((state) => {
  state.context.count++;
});
```
