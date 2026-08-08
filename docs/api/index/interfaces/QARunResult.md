[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / QARunResult

# Interface: QARunResult

Defined in: src/lifecycle/qa.ts:48

The aggregate result of executing a QA run against a prerelease, including per-test results and summary statistics.

## Properties

### id

> **id**: `string`

Defined in: src/lifecycle/qa.ts:50

Run ID

***

### matrix?

> `optional` **matrix?**: `Record`\<`string`, `string`\>

Defined in: src/lifecycle/qa.ts:68

Matrix combination (if applicable)

***

### passed

> **passed**: `boolean`

Defined in: src/lifecycle/qa.ts:56

Overall pass/fail

***

### results

> **results**: [`TestResult`](TestResult.md)[]

Defined in: src/lifecycle/qa.ts:58

Per-test results

***

### summary

> **summary**: `object`

Defined in: src/lifecycle/qa.ts:60

Summary

#### duration

> **duration**: `number`

#### failed

> **failed**: `number`

#### passed

> **passed**: `number`

#### skipped

> **skipped**: `number`

#### total

> **total**: `number`

***

### timestamp

> **timestamp**: `number`

Defined in: src/lifecycle/qa.ts:54

Timestamp

***

### version

> **version**: `string`

Defined in: src/lifecycle/qa.ts:52

Prerelease version tested
