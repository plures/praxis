[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExperimentStep

# Type Alias: ExperimentStep

> **ExperimentStep** = \{ `facts`: `object`[]; `kind`: `"inject-facts"`; \} \| \{ `events`: `object`[]; `kind`: `"inject-events"`; \} \| \{ `kind`: `"run-engine"`; `maxSteps`: `number`; \} \| \{ `kind`: `"modify-rule"`; `modification`: `string`; `ruleId`: `string`; \} \| \{ `description`: `string`; `kind`: `"observe"`; `metric`: `string`; \} \| \{ `condition`: `string`; `expected`: `unknown`; `kind`: `"assert"`; \} \| \{ `durationMs`: `number`; `kind`: `"wait"`; \} \| \{ `kind`: `"external-query"`; `query`: `string`; `source`: `string`; `timeout`: `number`; \} \| \{ `expectedPattern?`: `string`; `kind`: `"model-prompt"`; `prompt`: `string`; `temperature?`: `number`; \}

Defined in: src/experiments/index.ts:139

A single step in an experiment — inject, run, observe, assert, or wait.
