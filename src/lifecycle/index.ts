/**
 * Praxis Lifecycle Engine — Public API
 */

// Types
export type {
  LifecycleExpectation,
  ExpectationType,
  ExpectationPriority,
  LifecycleEventName,
  LifecycleEvent,
  LifecycleConfig,
  TriggerAction,
  TriggerContext,
  TriggerResult,
  TriggerDefinition,
  ClassificationResult,
  VersioningConfig,
  QAConfig,
  GitHubTriggerOptions,
  GitLabTriggerOptions,
  AgentTriggerOptions,
  RegistryPublishOptions,
} from './types.js';

// Event Bus
export { createEventBus } from './event-bus.js';
export type { EventBus, EventBusOptions, DispatchResult } from './event-bus.js';

// Expectation DSL
export {
  expectation,
  defineExpectation,
  classifyExpectation,
  loadExpectations,
  ExpectationBuilder,
} from './expectation.js';

// Triggers
export { triggers } from './triggers.js';

// Config
export { defineTriggers, defineLifecycle } from './config.js';
export type { TriggerMap } from './config.js';
