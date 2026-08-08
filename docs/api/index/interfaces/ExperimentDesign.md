[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExperimentDesign

# Interface: ExperimentDesign

Defined in: src/experiments/index.ts:120

Steps, metrics, and resource budget for running an experiment.

## Properties

### control?

> `optional` **control?**: `object`

Defined in: src/experiments/index.ts:132

Control group configuration (for A/B)

#### description

> **description**: `string`

#### steps

> **steps**: [`ExperimentStep`](../type-aliases/ExperimentStep.md)[]

***

### maxDurationMs

> **maxDurationMs**: `number`

Defined in: src/experiments/index.ts:126

How long to run (ms)

***

### maxResourceBudget

> **maxResourceBudget**: `number`

Defined in: src/experiments/index.ts:128

Max resource budget (abstract units)

***

### metrics

> **metrics**: `string`[]

Defined in: src/experiments/index.ts:124

What to measure

***

### steps

> **steps**: [`ExperimentStep`](../type-aliases/ExperimentStep.md)[]

Defined in: src/experiments/index.ts:122

Steps to execute

***

### trials

> **trials**: `number`

Defined in: src/experiments/index.ts:130

Number of trials for statistical significance
