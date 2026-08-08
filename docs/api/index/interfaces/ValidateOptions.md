[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ValidateOptions

# Interface: ValidateOptions

Defined in: packages/praxis-core/src/decision-ledger/validation.ts:20

Options for contract validation.

## Properties

### artifactIndex?

> `optional` **artifactIndex?**: `ArtifactIndex`

Defined in: packages/praxis-core/src/decision-ledger/validation.ts:30

Optional index of artifacts for test/spec presence

***

### incompleteSeverity?

> `optional` **incompleteSeverity?**: [`Severity`](../type-aliases/Severity.md)

Defined in: packages/praxis-core/src/decision-ledger/validation.ts:26

Severity for incomplete contracts (default: 'warning')

***

### missingSeverity?

> `optional` **missingSeverity?**: [`Severity`](../type-aliases/Severity.md)

Defined in: packages/praxis-core/src/decision-ledger/validation.ts:24

Severity for missing contracts (default: 'warning')

***

### requiredFields?

> `optional` **requiredFields?**: (`"behavior"` \| `"examples"` \| `"invariants"`)[]

Defined in: packages/praxis-core/src/decision-ledger/validation.ts:28

Required contract fields

***

### strict?

> `optional` **strict?**: `boolean`

Defined in: packages/praxis-core/src/decision-ledger/validation.ts:22

Treat missing contracts as errors instead of warnings
