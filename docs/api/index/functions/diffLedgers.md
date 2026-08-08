[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / diffLedgers

# Function: diffLedgers()

> **diffLedgers**(`before`, `after`): [`LedgerDiff`](../interfaces/LedgerDiff.md)

Defined in: packages/praxis-core/src/decision-ledger/report.ts:303

Diff two analysis reports to find what changed between them.

## Parameters

### before

[`AnalysisReport`](../interfaces/AnalysisReport.md)

The earlier analysis report (baseline)

### after

[`AnalysisReport`](../interfaces/AnalysisReport.md)

The later analysis report (current state)

## Returns

[`LedgerDiff`](../interfaces/LedgerDiff.md)

A [LedgerDiff](../interfaces/LedgerDiff.md) listing changes in findings between the two reports
