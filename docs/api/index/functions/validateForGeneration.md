[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / validateForGeneration

# Function: validateForGeneration()

> **validateForGeneration**(`schema`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: src/core/schema/loader.common.ts:136

Validate that a loaded schema has required fields for generation

## Parameters

### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The schema to validate for code generation compatibility

## Returns

[`ValidationResult`](../interfaces/ValidationResult.md)

A [ValidationResult](../interfaces/ValidationResult.md) with `valid` flag and any generation-specific errors
