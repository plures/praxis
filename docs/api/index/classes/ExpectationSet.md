[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExpectationSet

# Class: ExpectationSet

Defined in: src/expectations/expectations.ts:87

A collection of expectations for a specific domain.

## Constructors

### Constructor

> **new ExpectationSet**(`options`): `ExpectationSet`

Defined in: src/expectations/expectations.ts:92

#### Parameters

##### options

[`ExpectationSetOptions`](../interfaces/ExpectationSetOptions.md)

#### Returns

`ExpectationSet`

## Properties

### description

> `readonly` **description**: `string`

Defined in: src/expectations/expectations.ts:89

***

### name

> `readonly` **name**: `string`

Defined in: src/expectations/expectations.ts:88

## Accessors

### expectations

#### Get Signature

> **get** **expectations**(): readonly [`Expectation`](Expectation.md)[]

Defined in: src/expectations/expectations.ts:104

Get all expectations in this set.

##### Returns

readonly [`Expectation`](Expectation.md)[]

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: src/expectations/expectations.ts:109

Number of expectations.

##### Returns

`number`

## Methods

### add()

> **add**(`expectation`): `this`

Defined in: src/expectations/expectations.ts:98

Add an expectation to the set.

#### Parameters

##### expectation

[`Expectation`](Expectation.md)

#### Returns

`this`
