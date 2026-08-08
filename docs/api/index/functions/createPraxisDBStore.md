[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createPraxisDBStore

# Function: createPraxisDBStore()

> **createPraxisDBStore**\<`TContext`\>(`db`, `registry`, `initialContext?`, `onRuleError?`): [`PraxisDBStore`](../classes/PraxisDBStore.md)\<`TContext`\>

Defined in: src/core/pluresdb/store.ts:615

Create a new PraxisDBStore

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### db

[`PraxisDB`](../interfaces/PraxisDB.md)

The PraxisDB instance to use

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The PraxisRegistry for rules and constraints

### initialContext?

`TContext`

Optional initial context

### onRuleError?

`RuleErrorHandler`

Optional error handler for rule execution errors

## Returns

[`PraxisDBStore`](../classes/PraxisDBStore.md)\<`TContext`\>

PraxisDBStore instance

## Example

```typescript
const db = createInMemoryDB();
const registry = new PraxisRegistry();
const store = createPraxisDBStore(db, registry);

await store.storeFact({ tag: "UserLoggedIn", payload: { userId: "alice" } });
await store.appendEvent({ tag: "LOGIN", payload: { username: "alice" } });
```
