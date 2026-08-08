[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / sortModelsByDependencies

# Function: sortModelsByDependencies()

> **sortModelsByDependencies**(`models`): [`NormalizedModel`](../interfaces/NormalizedModel.md)[]

Defined in: src/core/schema/normalize.ts:282

Sort models by dependency order (models with no dependencies first)

## Parameters

### models

[`NormalizedModel`](../interfaces/NormalizedModel.md)[]

Array of normalized models to sort topologically

## Returns

[`NormalizedModel`](../interfaces/NormalizedModel.md)[]

Models sorted so that dependencies come before their dependents
