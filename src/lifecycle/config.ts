/**
 * Praxis Lifecycle Engine — Configuration Helpers
 *
 * Helper to define lifecycle configuration for a project.
 * The defineTriggers() function is the main customization point.
 */

import type {
  LifecycleConfig,
  LifecycleEventName,
  TriggerAction,
  TriggerDefinition,
} from './types.js';

// ─── Configuration Builder ──────────────────────────────────────────────────

/** Shorthand trigger map: event name → action(s) */
export type TriggerMap = Partial<Record<LifecycleEventName, TriggerAction | TriggerAction[]>>;

/**
 * Define triggers for a project.
 *
 * @example
 * ```ts
 * import { defineTriggers, triggers } from '@plures/praxis/lifecycle';
 *
 * export default defineTriggers({
 *   'lifecycle/design/expectation.classified': [
 *     triggers.github.createIssue({ owner: 'my-org', repo: 'my-app', assignee: 'copilot' }),
 *     triggers.consoleLog('📝'),
 *   ],
 *   'lifecycle/integrate/merge.executed': [
 *     triggers.version.bumpSemver(),
 *     triggers.release.tagPrerelease(),
 *   ],
 *   'lifecycle/qa/qa.passed': [
 *     triggers.release.promoteToStable(),
 *     triggers.registry.publishStable({ registries: ['npm'] }),
 *   ],
 * });
 * ```
 */
export function defineTriggers(map: TriggerMap): TriggerDefinition[] {
  const triggers: TriggerDefinition[] = [];

  for (const [eventName, actions] of Object.entries(map)) {
    if (!actions) continue;
    const actionArray = Array.isArray(actions) ? actions : [actions];
    triggers.push({
      on: eventName as LifecycleEventName,
      actions: actionArray,
    });
  }

  return triggers;
}

/**
 * Define a complete lifecycle configuration for a project.
 *
 * @example
 * ```ts
 * import { defineLifecycle, defineTriggers, triggers } from '@plures/praxis/lifecycle';
 *
 * export default defineLifecycle({
 *   name: 'my-app',
 *   triggers: defineTriggers({
 *     'lifecycle/design/expectation.classified': [
 *       triggers.github.createIssue({ owner: 'org', repo: 'app' }),
 *     ],
 *   }),
 *   versioning: {
 *     strategy: 'expectation-driven',
 *     versionFiles: ['package.json', 'Cargo.toml'],
 *   },
 *   qa: {
 *     branchPrefix: 'qa/',
 *     artifactsDir: 'qa/results',
 *   },
 * });
 * ```
 */
export function defineLifecycle(config: LifecycleConfig): LifecycleConfig {
  return {
    ...config,
    triggers: config.triggers ?? [],
    versioning: config.versioning ?? {
      strategy: 'expectation-driven',
      versionFiles: ['package.json'],
    },
    qa: config.qa ?? {
      branchPrefix: 'qa/',
      artifactsDir: 'qa/results',
    },
  };
}
