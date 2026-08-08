[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / attachToEngine

# Function: attachToEngine()

> **attachToEngine**\<`TContext`\>(`store`, `engine`): [`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Defined in: src/integrations/pluresdb.ts:247

Attach a PraxisDBStore to a LogicEngine

This function creates a bidirectional connection between the store and engine:
- Events processed by the engine are persisted to the store
- Facts from the store are synchronized to the engine

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### store

[`PraxisDBStore`](../classes/PraxisDBStore.md)\<`TContext`\>

The PraxisDBStore instance

### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

The LogicEngine instance

## Returns

[`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Cleanup function to detach the store

## Example

```typescript
const db = createInMemoryDB();
const registry = new PraxisRegistry();
const store = createPraxisDBStore(db, registry);
const engine = createPraxisEngine({ initialContext: {}, registry });

const detach = attachToEngine(store, engine);

// Events are now automatically persisted
engine.step([{ tag: "LOGIN", payload: { username: "alice" } }]);

// Cleanup
detach();
```
