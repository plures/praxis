[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateLedger

# Function: generateLedger()

> **generateLedger**\<`TContext`\>(`registry`, `engine`, `expectations?`): [`AnalysisReport`](../interfaces/AnalysisReport.md)

Defined in: packages/praxis-core/src/decision-ledger/report.ts:49

Generate the full analysis report.

This is the main entry point for the Decision Ledger analyzer.
It runs all analyses and produces a comprehensive report.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules and constraints

### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

The logic engine instance to analyze current state

### expectations?

`ExpectationSet`

Optional expectation set to check coverage against

## Returns

[`AnalysisReport`](../interfaces/AnalysisReport.md)

A comprehensive [AnalysisReport](../interfaces/AnalysisReport.md) with dead rules, contradictions, gaps, and health score
