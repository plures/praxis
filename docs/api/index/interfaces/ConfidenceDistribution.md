[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ConfidenceDistribution

# Interface: ConfidenceDistribution

Defined in: src/analysis/index.ts:56

Confidence distribution across all tracked facts.

## Properties

### buckets

> **buckets**: `object`[]

Defined in: src/analysis/index.ts:57

#### count

> **count**: `number`

#### facts

> **facts**: `string`[]

#### max

> **max**: `number`

#### min

> **min**: `number`

#### range

> **range**: `string`

***

### mean

> **mean**: `number`

Defined in: src/analysis/index.ts:58

***

### median

> **median**: `number`

Defined in: src/analysis/index.ts:59

***

### propagationAnomalies

> **propagationAnomalies**: `object`[]

Defined in: src/analysis/index.ts:62

Facts where propagated confidence differs significantly from declared confidence

#### declaredConfidence

> **declaredConfidence**: `number`

#### delta

> **delta**: `number`

#### factId

> **factId**: `string`

#### propagatedConfidence

> **propagatedConfidence**: `number`

#### weakestDependency

> **weakestDependency**: `string`

***

### stdDev

> **stdDev**: `number`

Defined in: src/analysis/index.ts:60
