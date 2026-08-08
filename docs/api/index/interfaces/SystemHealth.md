[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / SystemHealth

# Interface: SystemHealth

Defined in: src/integration/hub.ts:73

Overall health snapshot for the Praxis system — score, status, and key metrics.

## Properties

### metrics

> **metrics**: `object`

Defined in: src/integration/hub.ts:79

Key metrics

#### activeExperiments

> **activeExperiments**: `number`

#### coverageRatio

> **coverageRatio**: `number`

#### criticalChainCount

> **criticalChainCount**: `number`

#### factCount

> **factCount**: `number`

#### meanConfidence

> **meanConfidence**: `number`

#### pendingResearch

> **pendingResearch**: `number`

#### predictionAccuracy

> **predictionAccuracy**: `number`

#### staleFactCount

> **staleFactCount**: `number`

***

### score

> **score**: `number`

Defined in: src/integration/hub.ts:75

Overall health score [0.0-1.0]

***

### status

> **status**: `"green"` \| `"yellow"` \| `"red"`

Defined in: src/integration/hub.ts:77

Color-coded status

***

### topIssues

> **topIssues**: `string`[]

Defined in: src/integration/hub.ts:90

Top issues
