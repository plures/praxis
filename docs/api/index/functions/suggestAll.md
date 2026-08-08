[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / suggestAll

# Function: suggestAll()

> **suggestAll**(`findings`): [`Suggestion`](../interfaces/Suggestion.md)[]

Defined in: packages/praxis-core/src/decision-ledger/suggestions.ts:60

Generate suggestions for all findings at once.

## Parameters

### findings

Object with optional arrays of each finding type to generate suggestions for

#### contractGaps?

[`ContractCoverageGap`](../interfaces/ContractCoverageGap.md)[]

#### contradictions?

[`Contradiction`](../interfaces/Contradiction.md)[]

#### deadRules?

[`DeadRule`](../interfaces/DeadRule.md)[]

#### gaps?

[`Gap`](../interfaces/Gap.md)[]

#### shadowedRules?

[`ShadowedRule`](../interfaces/ShadowedRule.md)[]

#### unreachableStates?

[`UnreachableState`](../interfaces/UnreachableState.md)[]

## Returns

[`Suggestion`](../interfaces/Suggestion.md)[]

Flat array of [Suggestion](../interfaces/Suggestion.md) objects, one per finding across all types
