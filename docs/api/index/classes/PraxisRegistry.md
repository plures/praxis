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

Defined in: packages/praxis-core/src/rules.ts:149

#### Parameters

##### options?

`PraxisRegistryOptions` = `{}`

#### Returns

`PraxisRegistry`\<`TContext`\>

## Methods

### clearContractGaps()

> **clearContractGaps**(): `void`

Defined in: packages/praxis-core/src/rules.ts:245

Clear collected contract gaps.

#### Returns

`void`

***

### getAllConstraints()

> **getAllConstraints**(): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/rules.ts:231

Get all constraints

#### Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

***

### getAllRules()

> **getAllRules**(): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/rules.ts:224

Get all rules

#### Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]

***

### getConstraint()

> **getConstraint**(`id`): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\> \| `undefined`

Defined in: packages/praxis-core/src/rules.ts:203

Get a constraint by ID

#### Parameters

##### id

`string`

#### Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\> \| `undefined`

***

### getConstraintIds()

> **getConstraintIds**(): `string`[]

Defined in: packages/praxis-core/src/rules.ts:217

Get all registered constraint IDs

#### Returns

`string`[]

***

### getContractGaps()

> **getContractGaps**(): [`ContractGap`](../interfaces/ContractGap.md)[]

Defined in: packages/praxis-core/src/rules.ts:238

Get collected contract gaps from registration-time validation.

#### Returns

[`ContractGap`](../interfaces/ContractGap.md)[]

***

### getRule()

> **getRule**(`id`): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\> \| `undefined`

Defined in: packages/praxis-core/src/rules.ts:196

Get a rule by ID

#### Parameters

##### id

`string`

#### Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\> \| `undefined`

***

### getRuleIds()

> **getRuleIds**(): `string`[]

Defined in: packages/praxis-core/src/rules.ts:210

Get all registered rule IDs

#### Returns

`string`[]

***

### registerConstraint()

> **registerConstraint**(`descriptor`): `void`

Defined in: packages/praxis-core/src/rules.ts:173

Register a constraint

#### Parameters

##### descriptor

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>

#### Returns

`void`

***

### registerModule()

> **registerModule**(`module`): `void`

Defined in: packages/praxis-core/src/rules.ts:184

Register a module (all its rules and constraints)

#### Parameters

##### module

[`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

#### Returns

`void`

***

### registerRule()

> **registerRule**(`descriptor`): `void`

Defined in: packages/praxis-core/src/rules.ts:162

Register a rule

#### Parameters

##### descriptor

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>

#### Returns

`void`
