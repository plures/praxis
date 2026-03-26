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
 * @param map - A {@link TriggerMap} mapping lifecycle event names to arrays of trigger actions
 * @returns Array of {@link TriggerDefinition} objects, one per event name
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
 *   'lifecycle/qa/qa.passed': [
 *     triggers.release.promoteToStable(),
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
 * @param config - The lifecycle configuration object with name, triggers, versioning, and QA settings
 * @returns The fully normalized {@link LifecycleConfig} with defaults applied
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
