[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LifecycleConfig

# Interface: LifecycleConfig

Defined in: src/lifecycle/types.ts:167

Full lifecycle configuration for a project

## Properties

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: src/lifecycle/types.ts:179

Custom metadata

***

### name

> **name**: `string`

Defined in: src/lifecycle/types.ts:169

Project name

***

### qa?

> `optional` **qa?**: [`QAConfig`](QAConfig.md)

Defined in: src/lifecycle/types.ts:175

QA config

***

### template?

> `optional` **template?**: `string`

Defined in: src/lifecycle/types.ts:177

Template name this was created from

***

### triggers

> **triggers**: [`TriggerDefinition`](TriggerDefinition.md)[]

Defined in: src/lifecycle/types.ts:171

Trigger definitions

***

### versioning?

> `optional` **versioning?**: [`VersioningConfig`](VersioningConfig.md)

Defined in: src/lifecycle/types.ts:173

Version engine config
