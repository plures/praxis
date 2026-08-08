[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateTestCases

# Function: generateTestCases()

> **generateTestCases**(`expectations`): [`TestCase`](../interfaces/TestCase.md)[]

Defined in: src/lifecycle/qa.ts:107

Generate test cases from expectation acceptance criteria.

Each acceptance criterion becomes a test case. Given/When/Then
criteria are parsed into structured steps.

## Parameters

### expectations

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)[]

Array of lifecycle expectations with acceptance criteria

## Returns

[`TestCase`](../interfaces/TestCase.md)[]

Array of [TestCase](../interfaces/TestCase.md) objects, one per acceptance criterion
