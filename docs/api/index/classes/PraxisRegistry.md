[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisRegistry

# Class: PraxisRegistry\<TContext\>

Defined in: packages/praxis-core/src/rules.ts:143

Registry for rules and constraints.
Maps IDs to their descriptors.

## Type Parameters

### TContext

`TContext` = `unknown`

## Constructors

### Constructor

> **new PraxisRegistry**\<`TContext`\>(`options?`): `PraxisRegistry`\<`TContext`\>

Defined in: packages/praxis-core/src/rules.ts:157

#### Parameters

##### options?

`PraxisRegistryOptions` = `{}`

#### Returns

`PraxisRegistry`\<`TContext`\>

## Methods

### clearContractGaps()

> **clearContractGaps**(): `void`

Defined in: packages/praxis-core/src/rules.ts:303

Clear collected contract gaps.

#### Returns

`void`

***

### getAllConstraints()

> **getAllConstraints**(): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/rules.ts:263

Get all constraints

#### Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

***

### getAllRules()

> **getAllRules**(): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/rules.ts:256

Get all rules

#### Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]

***

### getConstraint()

> **getConstraint**(`id`): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\> \| `undefined`

Defined in: packages/praxis-core/src/rules.ts:229

Get a constraint by ID

#### Parameters

##### id

`string`

#### Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\> \| `undefined`

***

### getConstraintIds()

> **getConstraintIds**(): `string`[]

Defined in: packages/praxis-core/src/rules.ts:246

Get all registered constraint IDs

#### Returns

`string`[]

***

### getContractGaps()

> **getContractGaps**(): [`ContractGap`](../interfaces/ContractGap.md)[]

Defined in: packages/praxis-core/src/rules.ts:296

Get collected contract gaps from registration-time validation.

#### Returns

[`ContractGap`](../interfaces/ContractGap.md)[]

***

### getRule()

> **getRule**(`id`): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\> \| `undefined`

Defined in: packages/praxis-core/src/rules.ts:222

Get a rule by ID

#### Parameters

##### id

`string`

#### Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\> \| `undefined`

***

### getRuleIds()

> **getRuleIds**(): `string`[]

Defined in: packages/praxis-core/src/rules.ts:236

Get all registered rule IDs

#### Returns

`string`[]

***

### getRuleIdsForEvents()

> **getRuleIdsForEvents**(`eventTags`): `string`[]

Defined in: packages/praxis-core/src/rules.ts:272

Get rule IDs relevant to a set of event tags using the pre-built index.
Returns catch-all rules plus any rules whose eventTypes overlap the given tags.
This avoids iterating all rules and checking eventTypes at evaluation time.

#### Parameters

##### eventTags

`Set`\<`string`\>

#### Returns

`string`[]

***

### registerConstraint()

> **registerConstraint**(`descriptor`): `void`

Defined in: packages/praxis-core/src/rules.ts:198

Register a constraint

#### Parameters

##### descriptor

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>

#### Returns

`void`

***

### registerModule()

> **registerModule**(`module`): `void`

Defined in: packages/praxis-core/src/rules.ts:210

Register a module (all its rules and constraints)

#### Parameters

##### module

[`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

#### Returns

`void`

***

### registerRule()

> **registerRule**(`descriptor`): `void`

Defined in: packages/praxis-core/src/rules.ts:170

Register a rule

#### Parameters

##### descriptor

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>

#### Returns

`void`
