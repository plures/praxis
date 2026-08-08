[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TriggerContext

# Interface: TriggerContext

Defined in: src/lifecycle/types.ts:127

Context available to trigger handlers

## Properties

### addExpectation

> **addExpectation**: (`expectation`) => `void`

Defined in: src/lifecycle/types.ts:137

Register a new expectation

#### Parameters

##### expectation

[`LifecycleExpectation`](LifecycleExpectation.md)

#### Returns

`void`

***

### config

> **config**: [`LifecycleConfig`](LifecycleConfig.md)

Defined in: src/lifecycle/types.ts:133

Project configuration

***

### emit

> **emit**: (`name`, `data`) => `void`

Defined in: src/lifecycle/types.ts:135

Emit a new lifecycle event (for chaining)

#### Parameters

##### name

[`LifecycleEventName`](../type-aliases/LifecycleEventName.md)

##### data

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### expectation?

> `optional` **expectation?**: [`LifecycleExpectation`](LifecycleExpectation.md)

Defined in: src/lifecycle/types.ts:129

The expectation that triggered this (if any)

***

### expectations

> **expectations**: `Map`\<`string`, [`LifecycleExpectation`](LifecycleExpectation.md)\>

Defined in: src/lifecycle/types.ts:131

All expectations in the project

***

### getAllExpectations

> **getAllExpectations**: () => [`LifecycleExpectation`](LifecycleExpectation.md)[]

Defined in: src/lifecycle/types.ts:139

Get all expectations

#### Returns

[`LifecycleExpectation`](LifecycleExpectation.md)[]
