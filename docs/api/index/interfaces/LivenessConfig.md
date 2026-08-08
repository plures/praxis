[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LivenessConfig

# Interface: LivenessConfig

Defined in: src/unified/types.ts:131

Liveness monitoring configuration — detect stale paths after initialization.

## Properties

### expect

> **expect**: `string`[]

Defined in: src/unified/types.ts:133

Paths that must update within `timeoutMs` after init

***

### onStale?

> `optional` **onStale?**: (`path`, `elapsed`) => `void`

Defined in: src/unified/types.ts:137

Callback when a path is stale

#### Parameters

##### path

`string`

##### elapsed

`number`

#### Returns

`void`

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: src/unified/types.ts:135

Milliseconds to wait before flagging staleness (default: 5000)
