[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TestCase

# Interface: TestCase

Defined in: src/lifecycle/qa.ts:18

A test case generated from the acceptance criteria of a [LifecycleExpectation](LifecycleExpectation.md).

## Properties

### description

> **description**: `string`

Defined in: src/lifecycle/qa.ts:26

Test description (from acceptance criteria)

***

### expectationId

> **expectationId**: `string`

Defined in: src/lifecycle/qa.ts:22

Source expectation

***

### id

> **id**: `string`

Defined in: src/lifecycle/qa.ts:20

Unique test ID

***

### priority

> **priority**: `string`

Defined in: src/lifecycle/qa.ts:32

Priority inherited from expectation

***

### steps?

> `optional` **steps?**: `object`

Defined in: src/lifecycle/qa.ts:28

Given/When/Then parsed from acceptance criteria

#### given?

> `optional` **given?**: `string`

#### then?

> `optional` **then?**: `string`

#### when?

> `optional` **when?**: `string`

***

### tags

> **tags**: `string`[]

Defined in: src/lifecycle/qa.ts:30

Tags for filtering

***

### title

> **title**: `string`

Defined in: src/lifecycle/qa.ts:24

Test title
