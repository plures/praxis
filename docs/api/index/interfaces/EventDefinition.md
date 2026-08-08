[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / EventDefinition

# Interface: EventDefinition\<TTag, TPayload\>

Defined in: src/dsl/index.ts:57

Strongly typed event definition

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Properties

### tag

> **tag**: `TTag`

Defined in: src/dsl/index.ts:58

## Methods

### create()

> **create**(`payload`): [`PraxisEvent`](PraxisEvent.md) & `object`

Defined in: src/dsl/index.ts:59

#### Parameters

##### payload

`TPayload`

#### Returns

[`PraxisEvent`](PraxisEvent.md) & `object`

***

### is()

> **is**(`event`): `event is PraxisEvent & { payload: TPayload; tag: TTag }`

Defined in: src/dsl/index.ts:60

#### Parameters

##### event

[`PraxisEvent`](PraxisEvent.md)

#### Returns

`event is PraxisEvent & { payload: TPayload; tag: TTag }`
