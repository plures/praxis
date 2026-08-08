[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DependencyHealthReport

# Interface: DependencyHealthReport

Defined in: src/analysis/index.ts:85

Health of the fact dependency graph — cycles, orphans, and critical chains.

## Properties

### criticalFacts

> **criticalFacts**: `object`[]

Defined in: src/analysis/index.ts:92

Single points of failure — facts with many dependents

#### confidence

> **confidence**: `number`

#### dependentCount

> **dependentCount**: `number`

#### factId

> **factId**: `string`

***

### cycles

> **cycles**: `string`[][]

Defined in: src/analysis/index.ts:90

Circular dependencies (should be zero)

***

### maxDepth

> **maxDepth**: `number`

Defined in: src/analysis/index.ts:88

***

### orphanedFacts

> **orphanedFacts**: `string`[]

Defined in: src/analysis/index.ts:94

Orphaned facts — no dependencies and no dependents

***

### totalEdges

> **totalEdges**: `number`

Defined in: src/analysis/index.ts:87

Dependency graph statistics
