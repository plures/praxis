[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisDiff

# Interface: PraxisDiff

Defined in: src/project/types.ts:58

Diff of rules, contracts, and expectations since the last commit.

## Properties

### contractsAdded

> **contractsAdded**: `string`[]

Defined in: src/project/types.ts:66

Contracts added

***

### contractsRemoved

> **contractsRemoved**: `string`[]

Defined in: src/project/types.ts:68

Contracts removed

***

### expectationsAdded

> **expectationsAdded**: `string`[]

Defined in: src/project/types.ts:70

Expectations added

***

### expectationsRemoved

> **expectationsRemoved**: `string`[]

Defined in: src/project/types.ts:72

Expectations removed

***

### gateChanges

> **gateChanges**: `object`[]

Defined in: src/project/types.ts:74

Gate state changes

#### from

> **from**: [`GateStatus`](../type-aliases/GateStatus.md)

#### gate

> **gate**: `string`

#### to

> **to**: [`GateStatus`](../type-aliases/GateStatus.md)

***

### rulesAdded

> **rulesAdded**: `string`[]

Defined in: src/project/types.ts:60

Rules added since last commit

***

### rulesModified

> **rulesModified**: `string`[]

Defined in: src/project/types.ts:64

Rules modified

***

### rulesRemoved

> **rulesRemoved**: `string`[]

Defined in: src/project/types.ts:62

Rules removed
