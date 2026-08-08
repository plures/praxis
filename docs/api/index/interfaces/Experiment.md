[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Experiment

# Interface: Experiment

Defined in: src/experiments/index.ts:88

A sandboxed experiment definition with hypothesis, design, and results.

## Properties

### author

> **author**: `string`

Defined in: src/experiments/index.ts:108

Who/what created this

***

### completedAt?

> `optional` **completedAt?**: `string`

Defined in: src/experiments/index.ts:115

***

### constraints

> **constraints**: `string`[]

Defined in: src/experiments/index.ts:112

Human-readable constraints on what this experiment can do

***

### createdAt

> **createdAt**: `string`

Defined in: src/experiments/index.ts:113

***

### design

> **design**: [`ExperimentDesign`](ExperimentDesign.md)

Defined in: src/experiments/index.ts:102

Experimental design

***

### hypothesis

> **hypothesis**: `object`

Defined in: src/experiments/index.ts:96

What we're testing

#### claim

> **claim**: `string`

#### confidence

> **confidence**: `number`

#### nullHypothesis

> **nullHypothesis**: `string`

***

### id

> **id**: `string`

Defined in: src/experiments/index.ts:89

***

### kind

> **kind**: [`ExperimentKind`](../type-aliases/ExperimentKind.md)

Defined in: src/experiments/index.ts:91

***

### name

> **name**: `string`

Defined in: src/experiments/index.ts:90

***

### requiresApproval

> **requiresApproval**: `boolean`

Defined in: src/experiments/index.ts:110

Approval required before running?

***

### researchQuestionId?

> `optional` **researchQuestionId?**: `string`

Defined in: src/experiments/index.ts:94

Research question this experiment addresses

***

### results?

> `optional` **results?**: [`ExperimentResults`](ExperimentResults.md)

Defined in: src/experiments/index.ts:106

Results (populated after completion)

***

### sandbox

> **sandbox**: [`SandboxConfig`](SandboxConfig.md)

Defined in: src/experiments/index.ts:104

Sandbox configuration

***

### startedAt?

> `optional` **startedAt?**: `string`

Defined in: src/experiments/index.ts:114

***

### status

> **status**: [`ExperimentStatus`](../type-aliases/ExperimentStatus.md)

Defined in: src/experiments/index.ts:92

***

### tags

> **tags**: `string`[]

Defined in: src/experiments/index.ts:116
