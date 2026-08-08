[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / diffContracts

# Function: diffContracts()

> **diffContracts**(`before`, `after`): [`ContractDiff`](../interfaces/ContractDiff.md)

Defined in: src/chronos/diff.ts:103

Compare contract coverage between two snapshots.

## Parameters

### before

[`ContractCoverage`](../interfaces/ContractCoverage.md)

The baseline contract coverage snapshot

### after

[`ContractCoverage`](../interfaces/ContractCoverage.md)

The current contract coverage snapshot

## Returns

[`ContractDiff`](../interfaces/ContractDiff.md)

A [ContractDiff](../interfaces/ContractDiff.md) listing contracts added, removed, and the change in coverage percentage
