[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TestMatrix

# Interface: TestMatrix

Defined in: src/lifecycle/qa.ts:36

A matrix of test combinations across multiple configuration axes (e.g., OS × Node version).

## Properties

### axes

> **axes**: `Record`\<`string`, `string`[]\>

Defined in: src/lifecycle/qa.ts:40

Axes to combine (e.g., { os: ['linux', 'macos'], node: ['18', '20'] })

***

### name

> **name**: `string`

Defined in: src/lifecycle/qa.ts:38

Matrix name

***

### testCaseIds

> **testCaseIds**: `string`[]

Defined in: src/lifecycle/qa.ts:44

Test case IDs to run

***

### totalCombinations

> **totalCombinations**: `number`

Defined in: src/lifecycle/qa.ts:42

Total combinations
