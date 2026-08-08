[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / RegistryIntrospector

# Class: RegistryIntrospector\<TContext\>

Defined in: packages/praxis-core/src/introspection.ts:99

Introspection utilities for a Praxis registry

## Type Parameters

### TContext

`TContext` = `unknown`

## Constructors

### Constructor

> **new RegistryIntrospector**\<`TContext`\>(`registry`): `RegistryIntrospector`\<`TContext`\>

Defined in: packages/praxis-core/src/introspection.ts:100

#### Parameters

##### registry

[`PraxisRegistry`](PraxisRegistry.md)\<`TContext`\>

#### Returns

`RegistryIntrospector`\<`TContext`\>

## Methods

### exportDOT()

> **exportDOT**(): `string`

Defined in: packages/praxis-core/src/introspection.ts:219

Export graph in DOT format (Graphviz)

This can be rendered with Graphviz tools or online services.

#### Returns

`string`

***

### exportMermaid()

> **exportMermaid**(): `string`

Defined in: packages/praxis-core/src/introspection.ts:256

Export graph in Mermaid format

Mermaid is a markdown-friendly diagramming language.

#### Returns

`string`

***

### generateGraph()

> **generateGraph**(): [`RegistryGraph`](../interfaces/RegistryGraph.md)

Defined in: packages/praxis-core/src/introspection.ts:151

Generate a graph representation of the registry

This creates nodes for rules and constraints.
Edges can be inferred from metadata if rules/constraints
document their dependencies.

#### Returns

[`RegistryGraph`](../interfaces/RegistryGraph.md)

***

### generateSchema()

> **generateSchema**(`protocolVersion`): [`RegistrySchema`](../interfaces/RegistrySchema.md)

Defined in: packages/praxis-core/src/introspection.ts:118

Generate a JSON schema representation of the registry

#### Parameters

##### protocolVersion

`string`

#### Returns

[`RegistrySchema`](../interfaces/RegistrySchema.md)

***

### getConstraintInfo()

> **getConstraintInfo**(`constraintId`): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\> \| `undefined`

Defined in: packages/praxis-core/src/introspection.ts:291

Get detailed information about a specific constraint

#### Parameters

##### constraintId

`string`

#### Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\> \| `undefined`

***

### getRuleInfo()

> **getRuleInfo**(`ruleId`): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\> \| `undefined`

Defined in: packages/praxis-core/src/introspection.ts:284

Get detailed information about a specific rule

#### Parameters

##### ruleId

`string`

#### Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\> \| `undefined`

***

### getStats()

> **getStats**(): [`RegistryStats`](../interfaces/RegistryStats.md)

Defined in: packages/praxis-core/src/introspection.ts:105

Get basic statistics about the registry

#### Returns

[`RegistryStats`](../interfaces/RegistryStats.md)

***

### searchConstraints()

> **searchConstraints**(`query`): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/introspection.ts:312

Search for constraints by description text

#### Parameters

##### query

`string`

#### Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

***

### searchRules()

> **searchRules**(`query`): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]

Defined in: packages/praxis-core/src/introspection.ts:298

Search for rules by description text

#### Parameters

##### query

`string`

#### Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]
