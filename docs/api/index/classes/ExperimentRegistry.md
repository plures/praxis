[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExperimentRegistry

# Class: ExperimentRegistry

Defined in: src/experiments/index.ts:203

In-memory registry for tracking and querying experiments by status or kind.

## Constructors

### Constructor

> **new ExperimentRegistry**(): `ExperimentRegistry`

#### Returns

`ExperimentRegistry`

## Methods

### get()

> **get**(`id`): [`Experiment`](../interfaces/Experiment.md) \| `undefined`

Defined in: src/experiments/index.ts:213

#### Parameters

##### id

`string`

#### Returns

[`Experiment`](../interfaces/Experiment.md) \| `undefined`

***

### list()

> **list**(`filter?`): [`Experiment`](../interfaces/Experiment.md)[]

Defined in: src/experiments/index.ts:217

#### Parameters

##### filter?

###### kind?

[`ExperimentKind`](../type-aliases/ExperimentKind.md)

###### status?

[`ExperimentStatus`](../type-aliases/ExperimentStatus.md)

###### tag?

`string`

#### Returns

[`Experiment`](../interfaces/Experiment.md)[]

***

### register()

> **register**(`experiment`): `void`

Defined in: src/experiments/index.ts:206

#### Parameters

##### experiment

[`Experiment`](../interfaces/Experiment.md)

#### Returns

`void`

***

### setResults()

> **setResults**(`id`, `results`): `void`

Defined in: src/experiments/index.ts:236

#### Parameters

##### id

`string`

##### results

[`ExperimentResults`](../interfaces/ExperimentResults.md)

#### Returns

`void`

***

### updateStatus()

> **updateStatus**(`id`, `status`): `void`

Defined in: src/experiments/index.ts:228

#### Parameters

##### id

`string`

##### status

[`ExperimentStatus`](../type-aliases/ExperimentStatus.md)

#### Returns

`void`
