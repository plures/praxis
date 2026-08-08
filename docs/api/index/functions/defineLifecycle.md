[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineLifecycle

# Function: defineLifecycle()

> **defineLifecycle**(`config`): [`LifecycleConfig`](../interfaces/LifecycleConfig.md)

Defined in: src/lifecycle/config.ts:84

Define a complete lifecycle configuration for a project.

## Parameters

### config

[`LifecycleConfig`](../interfaces/LifecycleConfig.md)

The lifecycle configuration object with name, triggers, versioning, and QA settings

## Returns

[`LifecycleConfig`](../interfaces/LifecycleConfig.md)

The fully normalized [LifecycleConfig](../interfaces/LifecycleConfig.md) with defaults applied

## Example

```ts
import { defineLifecycle, defineTriggers, triggers } from '@plures/praxis/lifecycle';

export default defineLifecycle({
  name: 'my-app',
  triggers: defineTriggers({
    'lifecycle/design/expectation.classified': [
      triggers.github.createIssue({ owner: 'org', repo: 'app' }),
    ],
  }),
  versioning: {
    strategy: 'expectation-driven',
    versionFiles: ['package.json', 'Cargo.toml'],
  },
  qa: {
    branchPrefix: 'qa/',
    artifactsDir: 'qa/results',
  },
});
```
