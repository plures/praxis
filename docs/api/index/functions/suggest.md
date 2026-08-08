[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / suggest

# Function: suggest()

> **suggest**(`finding`, `type`): [`Suggestion`](../interfaces/Suggestion.md)

Defined in: packages/praxis-core/src/decision-ledger/suggestions.ts:26

Generate a suggestion for any type of finding.

## Parameters

### finding

[`DeadRule`](../interfaces/DeadRule.md) \| [`UnreachableState`](../interfaces/UnreachableState.md) \| [`ShadowedRule`](../interfaces/ShadowedRule.md) \| [`Contradiction`](../interfaces/Contradiction.md) \| [`Gap`](../interfaces/Gap.md) \| [`ContractCoverageGap`](../interfaces/ContractCoverageGap.md)

The finding to generate a suggestion for

### type

[`FindingType`](../type-aliases/FindingType.md)

The type of finding, used to dispatch to the appropriate suggestion generator

## Returns

[`Suggestion`](../interfaces/Suggestion.md)

A [Suggestion](../interfaces/Suggestion.md) with a message, action, and priority
