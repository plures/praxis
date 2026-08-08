[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / AnalysisReport

# Interface: AnalysisReport

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:224

The complete analysis report from the decision ledger analyzer

## Properties

### contradictions

> **contradictions**: [`Contradiction`](Contradiction.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:236

Rules producing conflicting facts

***

### deadRules

> **deadRules**: [`DeadRule`](DeadRule.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:230

Rules that can never fire

***

### factDerivationChains

> **factDerivationChains**: [`DerivationChain`](DerivationChain.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:228

Fact derivation chains

***

### gaps

> **gaps**: [`Gap`](Gap.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:238

Expected behaviors with no covering rule

***

### shadowedRules

> **shadowedRules**: [`ShadowedRule`](ShadowedRule.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:234

Rules always overshadowed by another

***

### suggestions

> **suggestions**: [`Suggestion`](Suggestion.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:240

Actionable fix suggestions

***

### summary

> **summary**: `object`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:242

Summary statistics

#### contradictionCount

> **contradictionCount**: `number`

#### deadRuleCount

> **deadRuleCount**: `number`

#### gapCount

> **gapCount**: `number`

#### healthScore

> **healthScore**: `number`

#### shadowedRuleCount

> **shadowedRuleCount**: `number`

#### suggestionCount

> **suggestionCount**: `number`

#### totalConstraints

> **totalConstraints**: `number`

#### totalRules

> **totalRules**: `number`

#### unreachableStateCount

> **unreachableStateCount**: `number`

***

### timestamp

> **timestamp**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:226

Timestamp of the analysis

***

### unreachableStates

> **unreachableStates**: [`UnreachableState`](UnreachableState.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:232

Fact combos no rule can produce
