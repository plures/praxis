[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formatTestCasesAsCode

# Function: formatTestCasesAsCode()

> **formatTestCasesAsCode**(`cases`, `framework?`): `string`

Defined in: src/lifecycle/qa.ts:147

Format test cases as a test file template.

Generates a vitest/jest-compatible test file skeleton.

## Parameters

### cases

[`TestCase`](../interfaces/TestCase.md)[]

Test cases to format as code

### framework?

`"vitest"` \| `"jest"`

Test framework to target (`'vitest'` or `'jest'`; defaults to `'vitest'`)

## Returns

`string`

A string containing the auto-generated test file skeleton
