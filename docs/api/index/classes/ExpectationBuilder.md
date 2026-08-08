[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExpectationBuilder

# Class: ExpectationBuilder

Defined in: src/lifecycle/expectation.ts:18

Chainable builder for lifecycle expectations

## Constructors

### Constructor

> **new ExpectationBuilder**(`id`): `ExpectationBuilder`

Defined in: src/lifecycle/expectation.ts:21

#### Parameters

##### id

`string`

#### Returns

`ExpectationBuilder`

## Methods

### accept()

> **accept**(...`criteria`): `this`

Defined in: src/lifecycle/expectation.ts:54

Add acceptance criteria

#### Parameters

##### criteria

...`string`[]

#### Returns

`this`

***

### breaking()

> **breaking**(): `this`

Defined in: src/lifecycle/expectation.ts:72

Mark as breaking change (major version bump)

#### Returns

`this`

***

### build()

> **build**(): [`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

Defined in: src/lifecycle/expectation.ts:97

Build the expectation (validates required fields)

#### Returns

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

***

### describe()

> **describe**(`description`): `this`

Defined in: src/lifecycle/expectation.ts:42

Set the description

#### Parameters

##### description

`string`

#### Returns

`this`

***

### given()

> **given**(`given`): `object`

Defined in: src/lifecycle/expectation.ts:60

Add a Given/When/Then acceptance criterion

#### Parameters

##### given

`string`

#### Returns

`object`

##### when

> **when**: (`when`) => `object`

###### Parameters

###### when

`string`

###### Returns

`object`

###### then

> **then**: (`then`) => `ExpectationBuilder`

###### Parameters

###### then

`string`

###### Returns

`ExpectationBuilder`

***

### label()

> **label**(...`labels`): `this`

Defined in: src/lifecycle/expectation.ts:78

Add labels

#### Parameters

##### labels

...`string`[]

#### Returns

`this`

***

### meta()

> **meta**(`key`, `value`): `this`

Defined in: src/lifecycle/expectation.ts:90

Add metadata

#### Parameters

##### key

`string`

##### value

`unknown`

#### Returns

`this`

***

### priority()

> **priority**(`priority`): `this`

Defined in: src/lifecycle/expectation.ts:48

Set priority

#### Parameters

##### priority

[`ExpectationPriority`](../type-aliases/ExpectationPriority.md)

#### Returns

`this`

***

### relatedTo()

> **relatedTo**(...`ids`): `this`

Defined in: src/lifecycle/expectation.ts:84

Add related expectation IDs

#### Parameters

##### ids

...`string`[]

#### Returns

`this`

***

### title()

> **title**(`title`): `this`

Defined in: src/lifecycle/expectation.ts:36

Set the title

#### Parameters

##### title

`string`

#### Returns

`this`

***

### type()

> **type**(`type`): `this`

Defined in: src/lifecycle/expectation.ts:30

Set the expectation type

#### Parameters

##### type

[`ExpectationType`](../type-aliases/ExpectationType.md)

#### Returns

`this`
