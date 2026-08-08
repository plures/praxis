[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / StateDocsGenerator

# Class: StateDocsGenerator

Defined in: src/integrations/state-docs.ts:131

Documentation generator for Praxis schemas

## Constructors

### Constructor

> **new StateDocsGenerator**(`config`): `StateDocsGenerator`

Defined in: src/integrations/state-docs.ts:134

#### Parameters

##### config

[`StateDocsConfig`](../interfaces/StateDocsConfig.md)

#### Returns

`StateDocsGenerator`

## Methods

### generateFromModule()

> **generateFromModule**\<`TContext`\>(`module`): [`GeneratedDoc`](../interfaces/GeneratedDoc.md)[]

Defined in: src/integrations/state-docs.ts:184

Generate documentation from a Praxis registry

#### Type Parameters

##### TContext

`TContext`

#### Parameters

##### module

[`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

#### Returns

[`GeneratedDoc`](../interfaces/GeneratedDoc.md)[]

***

### generateFromSchema()

> **generateFromSchema**(`schema`): [`GeneratedDoc`](../interfaces/GeneratedDoc.md)[]

Defined in: src/integrations/state-docs.ts:154

Generate documentation from a Praxis schema

#### Parameters

##### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

#### Returns

[`GeneratedDoc`](../interfaces/GeneratedDoc.md)[]
