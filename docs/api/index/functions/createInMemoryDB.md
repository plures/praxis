[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createInMemoryDB

# Function: createInMemoryDB()

> **createInMemoryDB**(): [`InMemoryPraxisDB`](../classes/InMemoryPraxisDB.md)

Defined in: src/core/pluresdb/adapter.ts:120

Create a new in-memory PraxisDB instance

## Returns

[`InMemoryPraxisDB`](../classes/InMemoryPraxisDB.md)

InMemoryPraxisDB instance

## Example

```typescript
const db = createInMemoryDB();
await db.set('user:1', { name: 'Alice' });
const user = await db.get('user:1');
```
