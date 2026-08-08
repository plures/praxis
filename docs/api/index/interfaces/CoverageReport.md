[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CoverageReport

# Interface: CoverageReport

Defined in: src/analysis/index.ts:42

Fact coverage statistics — how much of the expected domain is actually known.

## Properties

### coverageRatio

> **coverageRatio**: `number`

Defined in: src/analysis/index.ts:52

***

### coveredDomains

> **coveredDomains**: `string`[]

Defined in: src/analysis/index.ts:44

Domains with at least one fact

***

### gapDomains

> **gapDomains**: `string`[]

Defined in: src/analysis/index.ts:46

Expected domains with no facts

***

### staleFacts

> **staleFacts**: `object`[]

Defined in: src/analysis/index.ts:48

Facts that haven't been verified in > threshold days

#### claim

> **claim**: `string`

#### daysSinceVerification

> **daysSinceVerification**: `number`

#### id

> **id**: `string`

#### lastVerified

> **lastVerified**: `string` \| `null`

***

### totalFacts

> **totalFacts**: `number`

Defined in: src/analysis/index.ts:50

Total facts vs. verified facts

***

### verifiedFacts

> **verifiedFacts**: `number`

Defined in: src/analysis/index.ts:51
