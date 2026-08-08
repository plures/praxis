[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnumChannel

# Interface: UnumChannel

Defined in: src/integrations/unum.ts:33

Unum channel for real-time communication

## Properties

### id

> **id**: `string`

Defined in: src/integrations/unum.ts:35

Channel identifier

***

### name

> **name**: `string`

Defined in: src/integrations/unum.ts:37

Channel name

## Methods

### getMembers()

> **getMembers**(): `Promise`\<[`UnumIdentity`](UnumIdentity.md)[]\>

Defined in: src/integrations/unum.ts:43

Get channel members

#### Returns

`Promise`\<[`UnumIdentity`](UnumIdentity.md)[]\>

***

### leave()

> **leave**(): `Promise`\<`void`\>

Defined in: src/integrations/unum.ts:45

Leave the channel

#### Returns

`Promise`\<`void`\>

***

### publish()

> **publish**(`message`): `Promise`\<`void`\>

Defined in: src/integrations/unum.ts:41

Publish a message to the channel

#### Parameters

##### message

`Omit`\<[`UnumMessage`](UnumMessage.md), `"timestamp"` \| `"channelId"`\>

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**(`handler`): () => `void`

Defined in: src/integrations/unum.ts:39

Subscribe to channel messages

#### Parameters

##### handler

(`message`) => `void`

#### Returns

() => `void`
