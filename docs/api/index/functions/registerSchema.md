[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / registerSchema

# Function: registerSchema()

> **registerSchema**(`db`, `schema`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/schema-registry.ts:149

Register a schema in PluresDB

Convenience function for one-off schema registration.

## Parameters

### db

[`PraxisDB`](../interfaces/PraxisDB.md)

The PraxisDB instance

### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The schema to register

## Returns

`Promise`\<`void`\>

A promise that resolves when the schema has been stored and indexed

## Example

```typescript
const db = createInMemoryDB();
await registerSchema(db, {
  version: "1.0.0",
  name: "MyApp",
  description: "My application schema"
});
```
