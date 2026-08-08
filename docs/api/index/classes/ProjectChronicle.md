[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ProjectChronicle

# Class: ProjectChronicle

Defined in: src/chronos/project-chronicle.ts:66

In-memory, append-only chronicle of project lifecycle events.

Thread-safe for single-threaded JS; immutable snapshots via `getEvents()`.

## Constructors

### Constructor

> **new ProjectChronicle**(`options?`): `ProjectChronicle`

Defined in: src/chronos/project-chronicle.ts:71

#### Parameters

##### options?

[`ProjectChronicleOptions`](../interfaces/ProjectChronicleOptions.md) = `{}`

#### Returns

`ProjectChronicle`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: src/chronos/project-chronicle.ts:184

Total number of recorded events.

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: src/chronos/project-chronicle.ts:189

Clear all events (primarily for testing).

#### Returns

`void`

***

### getEvents()

> **getEvents**(): [`ProjectEvent`](../interfaces/ProjectEvent.md)[]

Defined in: src/chronos/project-chronicle.ts:179

Return a shallow copy of all events.

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)[]

***

### record()

> **record**(`event`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:81

Record a project event. Returns the recorded event (with timestamp filled in).

#### Parameters

##### event

`Omit`\<[`ProjectEvent`](../interfaces/ProjectEvent.md), `"timestamp"`\> & `object`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordBuildAudit()

> **recordBuildAudit**(`score`, `delta`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:155

#### Parameters

##### score

`number`

##### delta

`number`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordContractAdded()

> **recordContractAdded**(`contractId`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:120

#### Parameters

##### contractId

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordContractModified()

> **recordContractModified**(`contractId`, `diff`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:124

#### Parameters

##### contractId

`string`

##### diff

###### after

`unknown`

###### before

`unknown`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordExpectationSatisfied()

> **recordExpectationSatisfied**(`name`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:132

#### Parameters

##### name

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordExpectationViolated()

> **recordExpectationViolated**(`name`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:136

#### Parameters

##### name

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordFactDeprecated()

> **recordFactDeprecated**(`factTag`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:172

#### Parameters

##### factTag

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordFactIntroduced()

> **recordFactIntroduced**(`factTag`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:168

#### Parameters

##### factTag

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordGateTransition()

> **recordGateTransition**(`gateName`, `from`, `to`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:140

#### Parameters

##### gateName

`string`

##### from

`string`

##### to

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordRuleModified()

> **recordRuleModified**(`ruleId`, `diff`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:108

#### Parameters

##### ruleId

`string`

##### diff

###### after

`unknown`

###### before

`unknown`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordRuleRegistered()

> **recordRuleRegistered**(`ruleId`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:104

#### Parameters

##### ruleId

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)

***

### recordRuleRemoved()

> **recordRuleRemoved**(`ruleId`, `meta?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)

Defined in: src/chronos/project-chronicle.ts:116

#### Parameters

##### ruleId

`string`

##### meta?

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)
