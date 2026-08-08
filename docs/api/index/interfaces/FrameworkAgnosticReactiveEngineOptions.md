[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / FrameworkAgnosticReactiveEngineOptions

# Interface: FrameworkAgnosticReactiveEngineOptions\<TContext\>

Defined in: packages/praxis-core/src/reactive-engine.ts:14

Praxis Reactive Logic Engine

A framework-agnostic reactive implementation of the Praxis Logic Engine.
Uses JavaScript Proxies to provide reactivity without Svelte-specific primitives.

This implementation provides:
- Proxy-based state tracking for automatic reactivity
- Subscription-based change notifications
- Computed/derived values support
- Compatible API with Svelte-based implementation

## Type Parameters

### TContext

`TContext`

## Properties

### initialContext

> **initialContext**: `TContext`

Defined in: packages/praxis-core/src/reactive-engine.ts:15

***

### initialFacts?

> `optional` **initialFacts?**: `unknown`[]

Defined in: packages/praxis-core/src/reactive-engine.ts:16

***

### initialMeta?

> `optional` **initialMeta?**: `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/reactive-engine.ts:17
