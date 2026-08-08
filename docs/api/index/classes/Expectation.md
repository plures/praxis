[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Expectation

# Class: Expectation

Defined in: src/expectations/expectations.ts:43

A behavioral expectation declaration.

Chainable API for declaring conditions under which a behavior
should or should not occur.

## Constructors

### Constructor

> **new Expectation**(`name`): `Expectation`

Defined in: src/expectations/expectations.ts:47

#### Parameters

##### name

`string`

#### Returns

`Expectation`

## Properties

### name

> `readonly` **name**: `string`

Defined in: src/expectations/expectations.ts:44

## Accessors

### conditions

#### Get Signature

> **get** **conditions**(): readonly [`ExpectationCondition`](../interfaces/ExpectationCondition.md)[]

Defined in: src/expectations/expectations.ts:77

Get all declared conditions.

##### Returns

readonly [`ExpectationCondition`](../interfaces/ExpectationCondition.md)[]

## Methods

### always()

> **always**(`condition`): `this`

Defined in: src/expectations/expectations.ts:71

Declare that this behavior should ALWAYS have a certain property.

#### Parameters

##### condition

`string`

#### Returns

`this`

***

### never()

> **never**(`condition`): `this`

Defined in: src/expectations/expectations.ts:63

Declare that this behavior should NEVER occur under a given condition.

#### Parameters

##### condition

`string`

#### Returns

`this`

***

### onlyWhen()

> **onlyWhen**(`condition`): `this`

Defined in: src/expectations/expectations.ts:55

Declare that this behavior should ONLY occur when a condition is true.
If the condition is false, the behavior should NOT occur.

#### Parameters

##### condition

`string`

#### Returns

`this`
