[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineTriggers

# Function: defineTriggers()

> **defineTriggers**(`map`): [`TriggerDefinition`](../interfaces/TriggerDefinition.md)[]

Defined in: src/lifecycle/config.ts:41

Define triggers for a project.

## Parameters

### map

[`TriggerMap`](../type-aliases/TriggerMap.md)

A [TriggerMap](../type-aliases/TriggerMap.md) mapping lifecycle event names to arrays of trigger actions

## Returns

[`TriggerDefinition`](../interfaces/TriggerDefinition.md)[]

Array of [TriggerDefinition](../interfaces/TriggerDefinition.md) objects, one per event name

## Example

```ts
import { defineTriggers, triggers } from '@plures/praxis/lifecycle';

export default defineTriggers({
  'lifecycle/design/expectation.classified': [
    triggers.github.createIssue({ owner: 'my-org', repo: 'my-app', assignee: 'copilot' }),
    triggers.consoleLog('📝'),
  ],
  'lifecycle/qa/qa.passed': [
    triggers.release.promoteToStable(),
  ],
});
```
