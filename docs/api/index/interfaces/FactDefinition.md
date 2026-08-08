[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / FactDefinition

# Interface: FactDefinition\<TTag, TPayload\>

Defined in: src/dsl/index.ts:21

Strongly typed fact definition

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Properties

### tag

> **tag**: `TTag`

Defined in: src/dsl/index.ts:22

## Methods

### create()

> **create**(`payload`): [`PraxisFact`](PraxisFact.md) & `object`

Defined in: src/dsl/index.ts:23

#### Parameters

##### payload

`TPayload`

#### Returns

[`PraxisFact`](PraxisFact.md) & `object`

***

### is()

> **is**(`fact`): `fact is PraxisFact & { payload: TPayload; tag: TTag }`

Defined in: src/dsl/index.ts:24

#### Parameters

##### fact

[`PraxisFact`](PraxisFact.md)

#### Returns

`fact is PraxisFact & { payload: TPayload; tag: TTag }`
