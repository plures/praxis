[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createABComparison

# Function: createABComparison()

> **createABComparison**(`opts`): [`Experiment`](../interfaces/Experiment.md)

Defined in: src/experiments/index.ts:796

Create an A/B comparison experiment.
Runs two rule strategies against the same inputs and compares outcomes.

## Parameters

### opts

#### comparisonMetrics

`string`[]

#### inputSteps

[`ExperimentStep`](../type-aliases/ExperimentStep.md)[]

#### name

`string`

#### strategyA

\{ `label`: `string`; `steps`: [`ExperimentStep`](../type-aliases/ExperimentStep.md)[]; \}

#### strategyA.label

`string`

#### strategyA.steps

[`ExperimentStep`](../type-aliases/ExperimentStep.md)[]

#### strategyB

\{ `label`: `string`; `steps`: [`ExperimentStep`](../type-aliases/ExperimentStep.md)[]; \}

#### strategyB.label

`string`

#### strategyB.steps

[`ExperimentStep`](../type-aliases/ExperimentStep.md)[]

## Returns

[`Experiment`](../interfaces/Experiment.md)
