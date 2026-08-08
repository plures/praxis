[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createModelCalibration

# Function: createModelCalibration()

> **createModelCalibration**(`opts`): [`Experiment`](../interfaces/Experiment.md)

Defined in: src/experiments/index.ts:739

Create a model calibration experiment.
Tests whether the assigned LLM produces expected outputs for known inputs.
This is how Praxis can help improve its own model.

## Parameters

### opts

#### modelId

`string`

#### temperature?

`number`

#### testPrompts

`object`[]

## Returns

[`Experiment`](../interfaces/Experiment.md)
