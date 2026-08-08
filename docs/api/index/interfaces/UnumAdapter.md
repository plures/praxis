[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnumAdapter

# Interface: UnumAdapter

Defined in: src/integrations/unum.ts:104

Unum adapter for Praxis engine integration

Provides identity management and channel-based communication
for distributed Praxis applications.

## Properties

### identity

> **identity**: [`UnumIdentity`](UnumIdentity.md) \| `null`

Defined in: src/integrations/unum.ts:106

Current identity

## Methods

### broadcastEvent()

> **broadcastEvent**(`channelId`, `event`): `Promise`\<`void`\>

Defined in: src/integrations/unum.ts:124

Broadcast a Praxis event to a channel

#### Parameters

##### channelId

`string`

##### event

[`PraxisEvent`](PraxisEvent.md)

#### Returns

`Promise`\<`void`\>

***

### broadcastFact()

> **broadcastFact**(`channelId`, `fact`): `Promise`\<`void`\>

Defined in: src/integrations/unum.ts:127

Broadcast a Praxis fact to a channel

#### Parameters

##### channelId

`string`

##### fact

[`PraxisFact`](PraxisFact.md)

#### Returns

`Promise`\<`void`\>

***

### createChannel()

> **createChannel**(`name`, `members?`): `Promise`\<[`UnumChannel`](UnumChannel.md)\>

Defined in: src/integrations/unum.ts:115

Create a new channel

#### Parameters

##### name

`string`

##### members?

`string`[]

#### Returns

`Promise`\<[`UnumChannel`](UnumChannel.md)\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: src/integrations/unum.ts:136

Disconnect and cleanup

#### Returns

`Promise`\<`void`\>

***

### getIdentity()

> **getIdentity**(`id`): `Promise`\<[`UnumIdentity`](UnumIdentity.md) \| `null`\>

Defined in: src/integrations/unum.ts:112

Get identity by ID

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`UnumIdentity`](UnumIdentity.md) \| `null`\>

***

### joinChannel()

> **joinChannel**(`channelId`): `Promise`\<[`UnumChannel`](UnumChannel.md)\>

Defined in: src/integrations/unum.ts:118

Join an existing channel

#### Parameters

##### channelId

`string`

#### Returns

`Promise`\<[`UnumChannel`](UnumChannel.md)\>

***

### listChannels()

> **listChannels**(): `Promise`\<[`UnumChannel`](UnumChannel.md)[]\>

Defined in: src/integrations/unum.ts:121

List available channels

#### Returns

`Promise`\<[`UnumChannel`](UnumChannel.md)[]\>

***

### setIdentity()

> **setIdentity**(`identity`): `Promise`\<[`UnumIdentity`](UnumIdentity.md)\>

Defined in: src/integrations/unum.ts:109

Create or update identity

#### Parameters

##### identity

`Omit`\<[`UnumIdentity`](UnumIdentity.md), `"id"` \| `"createdAt"`\>

#### Returns

`Promise`\<[`UnumIdentity`](UnumIdentity.md)\>

***

### subscribeToEvents()

> **subscribeToEvents**(`channelId`, `handler`): () => `void`

Defined in: src/integrations/unum.ts:130

Subscribe to events from a channel

#### Parameters

##### channelId

`string`

##### handler

(`event`) => `void`

#### Returns

() => `void`

***

### subscribeToFacts()

> **subscribeToFacts**(`channelId`, `handler`): () => `void`

Defined in: src/integrations/unum.ts:133

Subscribe to facts from a channel

#### Parameters

##### channelId

`string`

##### handler

(`fact`) => `void`

#### Returns

() => `void`
