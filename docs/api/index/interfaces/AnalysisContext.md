[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / AnalysisContext

# Interface: AnalysisContext

Defined in: src/analysis/index.ts:129

Input context required to run a full analysis cycle.

## Properties

### constraintStats

> **constraintStats**: `Map`\<`string`, \{ `lastViolation`: `string` \| `null`; `violations`: `number`; \}\>

Defined in: src/analysis/index.ts:132

***

### expectedDomains

> **expectedDomains**: `string`[]

Defined in: src/analysis/index.ts:134

***

### facts

> **facts**: `Map`\<`string`, `UncertainFact`\>

Defined in: src/analysis/index.ts:130

***

### predictions

> **predictions**: [`Prediction`](Prediction.md)[]

Defined in: src/analysis/index.ts:133

***

### ruleStats

> **ruleStats**: `Map`\<`string`, \{ `fires`: `number`; `lastFired`: `string` \| `null`; `noops`: `number`; \}\>

Defined in: src/analysis/index.ts:131

***

### staleThresholdDays

> **staleThresholdDays**: `number`

Defined in: src/analysis/index.ts:135
