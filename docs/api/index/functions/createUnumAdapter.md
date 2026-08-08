[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createUnumAdapter

# Function: createUnumAdapter()

> **createUnumAdapter**(`config`): `Promise`\<[`UnumAdapter`](../interfaces/UnumAdapter.md)\>

Defined in: src/integrations/unum.ts:166

Create a Unum adapter for Praxis engine integration

## Parameters

### config

[`UnumAdapterConfig`](../interfaces/UnumAdapterConfig.md)

Adapter configuration including the PluresDB instance, optional identity, and realtime flag

## Returns

`Promise`\<[`UnumAdapter`](../interfaces/UnumAdapter.md)\>

A promise resolving to a [UnumAdapter](../interfaces/UnumAdapter.md) connected to the given database

## Example

```typescript
import { createUnumAdapter } from '@plures/praxis/integrations/unum';
import { createInMemoryDB } from '@plures/praxis/integrations/pluresdb';

const db = createInMemoryDB();
const unum = await createUnumAdapter({
  db,
  identity: {
    name: 'Alice',
  },
  realtime: true,
});

// Create a channel
const channel = await unum.createChannel('my-channel');

// Broadcast events to the channel
await unum.broadcastEvent(channel.id, myEvent);
```
