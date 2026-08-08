[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / verifyContractExamples

# Function: verifyContractExamples()

> **verifyContractExamples**\<`TContext`\>(`rule`, `contract`): [`ContractVerificationResult`](../interfaces/ContractVerificationResult.md)

Defined in: packages/praxis-core/src/decision-ledger/contract-verification.ts:32

Actually run a rule's implementation against each contract example's
`given` state and verify the output matches `then`.

This is deeper than contract existence checking — it executes the rule.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### rule

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>

The rule descriptor to verify

### contract

[`Contract`](../interfaces/Contract.md)

The contract with Given/When/Then examples to run against the rule

## Returns

[`ContractVerificationResult`](../interfaces/ContractVerificationResult.md)

A [ContractVerificationResult](../interfaces/ContractVerificationResult.md) with per-example pass/fail status
