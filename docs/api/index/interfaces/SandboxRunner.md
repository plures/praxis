[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / SandboxRunner

# Interface: SandboxRunner

Defined in: src/experiments/index.ts:248

Interface for a sandbox runner that executes experiments in isolation.

## Methods

### run()

> **run**(`experiment`): `Promise`\<[`ExperimentResults`](ExperimentResults.md)\>

Defined in: src/experiments/index.ts:257

Execute an experiment in a sandboxed environment.
The sandbox guarantees:
- No mutation of production fact store
- No side effects beyond the sandbox
- Resource limits enforced
- Timeout enforced

#### Parameters

##### experiment

[`Experiment`](Experiment.md)

#### Returns

`Promise`\<[`ExperimentResults`](ExperimentResults.md)\>
