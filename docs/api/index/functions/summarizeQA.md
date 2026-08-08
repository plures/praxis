[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / summarizeQA

# Function: summarizeQA()

> **summarizeQA**(`results`, `version?`): [`QASummary`](../interfaces/QASummary.md)

Defined in: src/lifecycle/qa.ts:362

Summarize QA results for a specific version.

## Parameters

### results

[`QARunResult`](../interfaces/QARunResult.md)[]

Array of QA run results to summarize

### version?

`string`

Optional version string to filter results (e.g. `"2.0.0-rc.1"`); omit for all versions

## Returns

[`QASummary`](../interfaces/QASummary.md)

A [QASummary](../interfaces/QASummary.md) with overall pass/fail status and aggregated test counts
