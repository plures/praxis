[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / verify

# Function: verify()

> **verify**(`registry`, `expectations`): [`VerificationReport`](../interfaces/VerificationReport.md)

Defined in: src/expectations/expectations.ts:146

Verify expectations against a rule registry.

Walks the rule graph to determine if expectations are satisfied,
violated, or unverifiable given the registered rules and contracts.

## Parameters

### registry

[`VerifiableRegistry`](../interfaces/VerifiableRegistry.md)

The verifiable registry containing rules and constraints

### expectations

[`ExpectationSet`](../classes/ExpectationSet.md)

The expectation set to verify against the registry

## Returns

[`VerificationReport`](../interfaces/VerificationReport.md)

A [VerificationReport](../interfaces/VerificationReport.md) with per-expectation status and an overall summary
