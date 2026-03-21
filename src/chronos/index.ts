/**
 * Chronos — Project-Level Chronicle
 *
 * Records and queries the development lifecycle of a Praxis application:
 * rule registrations, contract changes, gate transitions, build audits, etc.
 *
 * @example
 * ```ts
 * import {
 *   createProjectChronicle,
 *   createTimeline,
 *   enableProjectChronicle,
 *   diffRegistries,
 * } from '@plures/praxis';
 *
 * // Manual recording
 * const chronicle = createProjectChronicle();
 * chronicle.recordRuleRegistered('auth/login', { description: 'Login rule' });
 *
 * // Auto-recording via hooks
 * const { chronicle: autoChronicle, disconnect } = enableProjectChronicle(registry, engine);
 * registry.registerRule(myRule); // automatically recorded
 *
 * // Querying
 * const timeline = createTimeline(autoChronicle);
 * const ruleEvents = timeline.getTimeline({ kind: 'rule' });
 * const delta = timeline.getDelta(startTs, endTs);
 *
 * // Behavioral diff
 * const diff = diffRegistries(snapshotBefore, snapshotAfter);
 * console.log(formatCommitMessage(diff));
 * ```
 */

// ── Project Chronicle (core event store) ────────────────────────────────────
export {
  ProjectChronicle,
  createProjectChronicle,
} from './project-chronicle.js';
export type {
  ProjectEvent,
  ProjectEventKind,
  ProjectChronicleOptions,
} from './project-chronicle.js';

// ── Timeline (queryable view) ───────────────────────────────────────────────
export {
  Timeline,
  createTimeline,
} from './timeline.js';
export type {
  TimelineFilter,
  BehavioralDelta,
} from './timeline.js';

// ── Hooks (auto-recording) ──────────────────────────────────────────────────
export {
  enableProjectChronicle,
  recordAudit,
} from './hooks.js';
export type {
  ChronicleHandle,
  EnableChronicleOptions,
} from './hooks.js';

// ── Diff (behavioral comparison) ────────────────────────────────────────────
export {
  diffRegistries,
  diffContracts,
  diffExpectations,
  formatDelta,
  formatCommitMessage,
  formatReleaseNotes,
} from './diff.js';
export type {
  RegistrySnapshot,
  RegistryDiff,
  ContractCoverage,
  ContractDiff,
  ExpectationSnapshot,
  ExpectationDiff,
  FullBehavioralDiff,
} from './diff.js';
