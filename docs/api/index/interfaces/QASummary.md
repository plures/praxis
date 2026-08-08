[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / QASummary

# Interface: QASummary

Defined in: src/lifecycle/qa.ts:344

Aggregated summary of QA results across all runs for a given prerelease version.

## Properties

### failedTests

> **failedTests**: `object`[]

Defined in: src/lifecycle/qa.ts:352

#### error?

> `optional` **error?**: `string`

#### runId

> **runId**: `string`

#### testId

> **testId**: `string`

#### title

> **title**: `string`

***

### lastRun?

> `optional` **lastRun?**: [`QARunResult`](QARunResult.md)

Defined in: src/lifecycle/qa.ts:347

***

### overallPassed

> **overallPassed**: `boolean`

Defined in: src/lifecycle/qa.ts:348

***

### totalFailed

> **totalFailed**: `number`

Defined in: src/lifecycle/qa.ts:351

***

### totalPassed

> **totalPassed**: `number`

Defined in: src/lifecycle/qa.ts:350

***

### totalRuns

> **totalRuns**: `number`

Defined in: src/lifecycle/qa.ts:346

***

### totalTests

> **totalTests**: `number`

Defined in: src/lifecycle/qa.ts:349

***

### version

> **version**: `string`

Defined in: src/lifecycle/qa.ts:345
