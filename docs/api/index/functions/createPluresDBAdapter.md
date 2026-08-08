[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createPluresDBAdapter

# Function: createPluresDBAdapter()

> **createPluresDBAdapter**\<`TContext`\>(`options`): [`PluresDBAdapter`](../interfaces/PluresDBAdapter.md)\<`TContext`\>

Defined in: src/integrations/pluresdb.ts:153

Create a PluresDB adapter with full implementation

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### options

[`PluresDBAdapterOptions`](../interfaces/PluresDBAdapterOptions.md)\<`TContext`\>

## Returns

[`PluresDBAdapter`](../interfaces/PluresDBAdapter.md)\<`TContext`\>

## Example

```typescript
const db = createInMemoryDB();
const registry = new PraxisRegistry();
const adapter = createPluresDBAdapter({ db, registry });

const engine = createPraxisEngine({ initialContext: {}, registry });
adapter.attachEngine(engine);

await adapter.persistFacts([{ tag: "UserLoggedIn", payload: { userId: "alice" } }]);
```
