[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ResearchQuestion

# Interface: ResearchQuestion

Defined in: src/research/index.ts:27

A research question generated from analysis gaps, anomalies, or prediction failures.

## Properties

### createdAt

> **createdAt**: `string`

Defined in: src/research/index.ts:61

***

### feasibility

> **feasibility**: `number`

Defined in: src/research/index.ts:42

Feasibility (0.0-1.0): how likely are we to answer this?

***

### findings?

> `optional` **findings?**: `object`

Defined in: src/research/index.ts:54

Results once completed

#### answer

> **answer**: `string`

#### evidence

> **evidence**: `object`[]

#### hypothesisConfirmed

> **hypothesisConfirmed**: `boolean` \| `null`

#### newFactIds

> **newFactIds**: `string`[]

#### updatedFactIds

> **updatedFactIds**: `string`[]

***

### hypothesis?

> `optional` **hypothesis?**: `object`

Defined in: src/research/index.ts:48

Hypothesis: what do we expect the answer to be?

#### claim

> **claim**: `string`

#### confidence

> **confidence**: `number`

#### rationale

> **rationale**: `string`

***

### id

> **id**: `string`

Defined in: src/research/index.ts:28

***

### impact

> **impact**: `number`

Defined in: src/research/index.ts:40

Impact if answered (0.0-1.0): how much would this improve our knowledge?

***

### motivation

> **motivation**: `string`

Defined in: src/research/index.ts:32

Why this question matters

***

### origin

> **origin**: [`ResearchOrigin`](../type-aliases/ResearchOrigin.md)

Defined in: src/research/index.ts:34

Where this question came from

***

### priority

> **priority**: `number`

Defined in: src/research/index.ts:44

Priority score = impact × feasibility

***

### proposedExperiments

> **proposedExperiments**: `string`[]

Defined in: src/research/index.ts:46

What experiments could answer this?

***

### question

> **question**: `string`

Defined in: src/research/index.ts:30

The question being investigated

***

### relatedIds

> **relatedIds**: `string`[]

Defined in: src/research/index.ts:36

Related fact/rule/anomaly IDs

***

### status

> **status**: [`ResearchStatus`](../type-aliases/ResearchStatus.md)

Defined in: src/research/index.ts:38

Current status

***

### updatedAt

> **updatedAt**: `string`

Defined in: src/research/index.ts:62
