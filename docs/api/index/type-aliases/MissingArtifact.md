[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / MissingArtifact

# Type Alias: MissingArtifact

> **MissingArtifact** = `"behavior"` \| `"examples"` \| `"invariants"` \| `"tests"` \| `"spec"` \| `"contract"`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:231

Types of artifacts that can be missing from a contract.

Note: 'tests' and 'spec' are included in this type for future extensibility
and SARIF reporting compatibility, but are not currently validated by the
validateContract function. To check for these, implement custom validation
logic that scans for test files or spec files in your codebase.
