[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TestResult

# Interface: TestResult

Defined in: src/lifecycle/qa.ts:72

The result of executing a single test case, including pass/fail status, duration, and any error details.

## Properties

### details?

> `optional` **details?**: `string`

Defined in: src/lifecycle/qa.ts:79

Stack trace or additional details

***

### duration

> **duration**: `number`

Defined in: src/lifecycle/qa.ts:76

***

### error?

> `optional` **error?**: `string`

Defined in: src/lifecycle/qa.ts:77

***

### status

> **status**: `"failed"` \| `"passed"` \| `"skipped"`

Defined in: src/lifecycle/qa.ts:75

***

### testId

> **testId**: `string`

Defined in: src/lifecycle/qa.ts:73

***

### title

> **title**: `string`

Defined in: src/lifecycle/qa.ts:74
