[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronicleSpan

# Interface: ChronicleSpan

Defined in: src/core/chronicle/context.ts:18

Chronicle Context

Synchronous causal context propagation for Chronicle span tracking.
Equivalent to Rust's `tracing` crate span context, adapted for TypeScript.

## Example

```typescript
// Run code attributed to a specific span/session
await ChronicleContext.runAsync(
  { spanId: 'route-decision-1', contextId: 'session-abc' },
  async () => {
    await store.storeFact(fact); // attributed to route-decision-1 / session-abc
  }
);
```

## Properties

### contextId?

> `optional` **contextId?**: `string`

Defined in: src/core/chronicle/context.ts:22

Session or request ID grouping related spans

***

### spanId?

> `optional` **spanId?**: `string`

Defined in: src/core/chronicle/context.ts:20

The span/operation ID (becomes the `cause` field on Chronicle nodes)
