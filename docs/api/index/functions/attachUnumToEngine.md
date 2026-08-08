[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / attachUnumToEngine

# Function: attachUnumToEngine()

> **attachUnumToEngine**\<`TContext`\>(`_engine`, `_adapter`, `_channelId`): () => `void`

Defined in: src/integrations/unum.ts:395

Attach Unum adapter to a Praxis engine

Enables automatic event/fact broadcasting to connected channels.
This is a placeholder for future integration where the engine
would emit events that get broadcast to channels.

## Type Parameters

### TContext

`TContext`

## Parameters

### \_engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

The Praxis logic engine

### \_adapter

[`UnumAdapter`](../interfaces/UnumAdapter.md)

The Unum adapter

### \_channelId

`string`

The channel to broadcast to

## Returns

Cleanup function

() => `void`
