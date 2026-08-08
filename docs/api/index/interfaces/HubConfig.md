[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / HubConfig

# Interface: HubConfig

Defined in: src/integration/hub.ts:110

Configuration for creating a [PraxisHub](PraxisHub.md) instance.

## Properties

### autoApproveThreshold

> **autoApproveThreshold**: `number`

Defined in: src/integration/hub.ts:120

Auto-approve experiments below this resource budget?

***

### chronicle?

> `optional` **chronicle?**: [`ProjectChronicle`](../classes/ProjectChronicle.md)

Defined in: src/integration/hub.ts:122

Chronos chronicle integration — records all hub events as ProjectEvents

***

### expectedDomains

> **expectedDomains**: `string`[]

Defined in: src/integration/hub.ts:116

Expected domains for coverage analysis

***

### experiments

> **experiments**: [`ExperimentRegistry`](../classes/ExperimentRegistry.md)

Defined in: src/integration/hub.ts:114

Experiment registry

***

### facts

> **facts**: `Map`\<`string`, `UncertainFact`\>

Defined in: src/integration/hub.ts:112

Fact store (shared with uncertainty module)

***

### modelPrompt?

> `optional` **modelPrompt?**: (`prompt`, `opts?`) => `Promise`\<`string`\>

Defined in: src/integration/hub.ts:124

Model prompt function for model-calibration experiments

#### Parameters

##### prompt

`string`

##### opts?

###### temperature?

`number`

#### Returns

`Promise`\<`string`\>

***

### staleThresholdDays

> **staleThresholdDays**: `number`

Defined in: src/integration/hub.ts:118

How old before a fact is "stale"
