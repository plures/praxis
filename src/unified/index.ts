/**
 * Praxis Unified — Public API
 *
 * This is the only import developers need:
 *
 *   import { createApp, definePath, defineRule, defineConstraint } from '@plures/praxis/unified';
 *
 * Everything else — stores, subscriptions, logging, validation — is automatic.
 */

export { createApp } from './core.js';
export type { PraxisApp } from './core.js';

export {
  definePath,
  type PathSchema,
  type QueryOptions,
  type ReactiveRef,
  type MutationResult,
  type UnifiedRule,
  type UnifiedConstraint,
  type LivenessConfig,
  type PraxisAppConfig,
} from './types.js';

export {
  defineRule,
  defineConstraint,
  defineModule,
  RuleResult,
  fact,
} from './rules.js';
