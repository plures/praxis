[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisHub

# Interface: PraxisHub

Defined in: src/integration/hub.ts:33

Public interface for the Praxis integration hub — analysis, research, and experiment orchestrator.

## Methods

### activeResearch()

> **activeResearch**(): [`ResearchQuestion`](ResearchQuestion.md)[]

Defined in: src/integration/hub.ts:53

Get all active research questions

#### Returns

[`ResearchQuestion`](ResearchQuestion.md)[]

***

### applyResults()

> **applyResults**(`experimentId`, `results`): `void`

Defined in: src/integration/hub.ts:38

Apply experiment results back to the fact store

#### Parameters

##### experimentId

`string`

##### results

[`ExperimentResults`](ExperimentResults.md)

#### Returns

`void`

***

### getCausalChain()

> **getCausalChain**(`factId`): [`CausalChainLink`](CausalChainLink.md)[]

Defined in: src/integration/hub.ts:59

Traces a fact back through the experiments and observations that established it

#### Parameters

##### factId

`string`

#### Returns

[`CausalChainLink`](CausalChainLink.md)[]

***

### getExperimentTimeline()

> **getExperimentTimeline**(): [`ProjectEvent`](ProjectEvent.md)[]

Defined in: src/integration/hub.ts:56

Returns all experiment events in chronological order from the chronicle

#### Returns

[`ProjectEvent`](ProjectEvent.md)[]

***

### health()

> **health**(): [`SystemHealth`](SystemHealth.md)

Defined in: src/integration/hub.ts:47

Get current system health summary

#### Returns

[`SystemHealth`](SystemHealth.md)

***

### latestAnalysis()

> **latestAnalysis**(): [`IntrospectionReport`](IntrospectionReport.md) \| `null`

Defined in: src/integration/hub.ts:50

Get the latest analysis report

#### Returns

[`IntrospectionReport`](IntrospectionReport.md) \| `null`

***

### predict()

> **predict**(`claim`, `confidence`, `deadline`, `rationale`): [`Prediction`](Prediction.md)

Defined in: src/integration/hub.ts:41

Make a testable prediction

#### Parameters

##### claim

`string`

##### confidence

`number`

##### deadline

`string`

##### rationale

`string`

#### Returns

[`Prediction`](Prediction.md)

***

### resolvePrediction()

> **resolvePrediction**(`predictionId`, `outcome`, `observation`): `void`

Defined in: src/integration/hub.ts:44

Resolve a prediction (was it right?)

#### Parameters

##### predictionId

`string`

##### outcome

`"correct"` \| `"incorrect"`

##### observation

`string`

#### Returns

`void`

***

### runCycle()

> **runCycle**(): `Promise`\<[`CycleResult`](CycleResult.md)\>

Defined in: src/integration/hub.ts:35

Run a full analysis → research → experiment planning cycle

#### Returns

`Promise`\<[`CycleResult`](CycleResult.md)\>
