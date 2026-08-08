[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisSchemaRegistry

# Class: PraxisSchemaRegistry

Defined in: src/core/pluresdb/schema-registry.ts:40

PraxisSchemaRegistry

Manages schema definitions in PluresDB.
Schemas are stored under `/_praxis/schemas/<schemaName>`

## Constructors

### Constructor

> **new PraxisSchemaRegistry**(`db`): `PraxisSchemaRegistry`

Defined in: src/core/pluresdb/schema-registry.ts:43

#### Parameters

##### db

[`PraxisDB`](../interfaces/PraxisDB.md)

#### Returns

`PraxisSchemaRegistry`

## Methods

### exists()

> **exists**(`schemaName`): `Promise`\<`boolean`\>

Defined in: src/core/pluresdb/schema-registry.ts:81

Check if a schema is registered

#### Parameters

##### schemaName

`string`

The schema name

#### Returns

`Promise`\<`boolean`\>

True if the schema exists

***

### get()

> **get**(`schemaName`): `Promise`\<[`StoredSchema`](../interfaces/StoredSchema.md) \| `undefined`\>

Defined in: src/core/pluresdb/schema-registry.ts:70

Get a schema by name

#### Parameters

##### schemaName

`string`

The schema name

#### Returns

`Promise`\<[`StoredSchema`](../interfaces/StoredSchema.md) \| `undefined`\>

The stored schema or undefined if not found

***

### list()

> **list**(): `Promise`\<`string`[]\>

Defined in: src/core/pluresdb/schema-registry.ts:105

List all registered schema names

Implementation note: This method uses an index stored at `/_praxis/schemas/_index`.
When using InMemoryPraxisDB, schemas must be registered using `registerWithIndex()`
for them to appear in this listing. When using a full PluresDB implementation,
native listing capabilities should be used instead.

#### Returns

`Promise`\<`string`[]\>

Array of registered schema names

***

### register()

> **register**(`schema`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/schema-registry.ts:52

Register a schema in PluresDB

#### Parameters

##### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The schema to register

#### Returns

`Promise`\<`void`\>

***

### registerWithIndex()

> **registerWithIndex**(`schema`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/schema-registry.ts:116

Register a schema and update the index

#### Parameters

##### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The schema to register

#### Returns

`Promise`\<`void`\>

***

### update()

> **update**(`schema`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/schema-registry.ts:91

Update a schema (replaces existing)

#### Parameters

##### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The updated schema

#### Returns

`Promise`\<`void`\>
