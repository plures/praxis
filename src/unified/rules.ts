/**
 * Praxis Unified — Rule DSL helpers
 *
 * Developers define rules as plain objects with watch paths.
 * No manual subscriptions, no wirePraxis(), no context mapping.
 */

import type { UnifiedRule, UnifiedConstraint } from './types.js';
import { RuleResult, fact } from '../core/rule-result.js';

export { RuleResult, fact };

/**
 * Define a rule that watches graph paths and auto-evaluates.
 *
 * @example
 * const sprintBehind = defineRule({
 *   id: 'sprint.behind',
 *   watch: ['sprint/current'],
 *   evaluate: (values) => {
 *     const sprint = values['sprint/current'];
 *     if (!sprint) return RuleResult.skip('No sprint');
 *     const pace = sprint.currentDay / sprint.totalDays;
 *     const work = sprint.completedHours / sprint.totalHours;
 *     if (work >= pace) return RuleResult.retract(['sprint.behind']);
 *     return RuleResult.emit([fact('sprint.behind', { pace, work })]);
 *   }
 * });
 *
 * @param rule - The unified rule descriptor with `id`, `watch`, `description`, and `evaluate`
 * @returns The rule descriptor unchanged (identity function — used for type inference)
 */
export function defineRule(rule: UnifiedRule): UnifiedRule {
  return rule;
}

/**
 * Define a constraint that validates mutations before they're applied.
 *
 * @example
 * const noCloseWithoutHours = defineConstraint({
 *   id: 'no-close-without-hours',
 *   description: 'Cannot close a work item with 0 completed hours',
 *   watch: ['sprint/items'],
 *   validate: (values) => {
 *     const items = values['sprint/items'] ?? [];
 *     const bad = items.find(i => i.state === 'Closed' && !i.completedWork);
 *     if (bad) return `Item #${bad.id} cannot be closed with 0 hours`;
 *     return true;
 *   }
 * });
 *
 * @param constraint - The constraint descriptor with `id`, `description`, `watch`, and `validate`
 * @returns The constraint descriptor unchanged (identity function — used for type inference)
 */
export function defineConstraint(constraint: UnifiedConstraint): UnifiedConstraint {
  return constraint;
}

/**
 * Compose multiple rules into a named module.
 *
 * @example
 * const sprintModule = defineModule('sprint-health', [
 *   sprintBehindRule,
 *   capacityRule,
 *   endNearRule,
 * ]);
 *
 * @param name - Human-readable module name (used for logging and introspection)
 * @param rules - Rules to group together in this module
 * @returns A module descriptor object with `name` and `rules`
 */
export function defineModule(name: string, rules: UnifiedRule[]): { name: string; rules: UnifiedRule[] } {
  return { name, rules };
}
