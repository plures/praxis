[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formatBuildOutput

# Function: formatBuildOutput()

> **formatBuildOutput**(`report`): `string`

Defined in: packages/praxis-core/src/decision-ledger/report.ts:248

Format report as CI-friendly output with warnings and errors.

Produces GitHub Actions annotation syntax (`::error::`, `::warning::`) so
problems are surfaced inline in CI log output.

## Parameters

### report

[`AnalysisReport`](../interfaces/AnalysisReport.md)

The analysis report from [generateLedger](generateLedger.md)

## Returns

`string`

A multi-line string with GitHub Actions annotation commands
