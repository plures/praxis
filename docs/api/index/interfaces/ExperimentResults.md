[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExperimentResults

# Interface: ExperimentResults

Defined in: src/experiments/index.ts:168

Outcomes, observations, and resource usage produced by a completed experiment.

## Properties

### conclusions

> **conclusions**: `string`[]

Defined in: src/experiments/index.ts:180

Derived conclusions

***

### confidence

> **confidence**: `number`

Defined in: src/experiments/index.ts:172

Statistical confidence in the result

***

### error?

> `optional` **error?**: `string`

Defined in: src/experiments/index.ts:190

Error if the experiment itself failed

***

### factUpdates

> **factUpdates**: `object`[]

Defined in: src/experiments/index.ts:182

Facts to update based on results

#### action

> **action**: `"create"` \| `"update-confidence"` \| `"add-evidence"` \| `"challenge"`

#### details

> **details**: `Record`\<`string`, `unknown`\>

#### factId

> **factId**: `string`

***

### hypothesisSupported

> **hypothesisSupported**: `boolean` \| `null`

Defined in: src/experiments/index.ts:170

Did the hypothesis hold?

***

### newQuestions

> **newQuestions**: `string`[]

Defined in: src/experiments/index.ts:188

New research questions generated

***

### observations

> **observations**: `object`[]

Defined in: src/experiments/index.ts:174

Raw observations

#### metric

> **metric**: `string`

#### timestamp

> **timestamp**: `string`

#### value

> **value**: `unknown`

***

### resourceUsage

> **resourceUsage**: `object`

Defined in: src/experiments/index.ts:192

Resource usage

#### apiCalls

> **apiCalls**: `number`

#### durationMs

> **durationMs**: `number`

#### memoryPeakBytes

> **memoryPeakBytes**: `number`

#### tokensUsed

> **tokensUsed**: `number`
