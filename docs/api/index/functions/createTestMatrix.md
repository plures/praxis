[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createTestMatrix

# Function: createTestMatrix()

> **createTestMatrix**(`name`, `axes`, `testCaseIds`): [`TestMatrix`](../interfaces/TestMatrix.md)

Defined in: src/lifecycle/qa.ts:208

Create a test matrix from axes.

## Parameters

### name

`string`

Name for this test matrix

### axes

`Record`\<`string`, `string`[]\>

Record of axis names to their possible values (e.g. `{ browser: ['chrome', 'firefox'] }`)

### testCaseIds

`string`[]

IDs of test cases this matrix applies to

## Returns

[`TestMatrix`](../interfaces/TestMatrix.md)

A [TestMatrix](../interfaces/TestMatrix.md) with pre-computed `totalCombinations`
