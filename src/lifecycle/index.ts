/**
 * Praxis Lifecycle Engine — Public API
 *
 * Full software lifecycle automation:
 * Design → Develop → Review → Integrate → Version → QA → Release → Maintain
 */

// ── Core Types ──────────────────────────────────────────────────────────────
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

// ── Event Bus ───────────────────────────────────────────────────────────────
export { createEventBus } from './event-bus.js';
export type { EventBus, EventBusOptions, DispatchResult } from './event-bus.js';

// ── Expectation DSL ─────────────────────────────────────────────────────────
export {
  expectation,
  defineExpectation,
  classifyExpectation,
  loadExpectations,
  ExpectationBuilder,
} from './expectation.js';

// ── Trigger Adapters ────────────────────────────────────────────────────────
export { triggers } from './triggers.js';

// ── Config Helpers ──────────────────────────────────────────────────────────
export { defineTriggers, defineLifecycle } from './config.js';
export type { TriggerMap } from './config.js';

// ── Version Engine (Phase 3) ────────────────────────────────────────────────
export {
  parseSemver,
  formatSemver,
  calculateBump,
  applyBump,
  incrementPrerelease,
  promoteToStable,
  readVersionFromFile,
  writeVersionToFile,
  syncVersions,
  checkVersionConsistency,
  generateChangelogEntry,
  formatChangelog,
  writeChangelog,
  orchestrateVersionBump,
} from './version.js';
export type {
  SemverVersion,
  BumpType,
  VersionBumpResult,
  VersionSyncResult,
  ChangelogEntry,
} from './version.js';

// ── QA Integration (Phase 4) ────────────────────────────────────────────────
export {
  generateTestCases,
  formatTestCasesAsCode,
  createTestMatrix,
  expandMatrix,
  writeQAArtifact,
  writeTestCases,
  writeQARunResult,
  loadQARunResults,
  summarizeQA,
  formatQASummary,
} from './qa.js';
export type {
  TestCase,
  TestMatrix,
  QARunResult,
  TestResult,
  QAArtifact,
  QASummary,
} from './qa.js';

// ── Review Automation (Phase 5) ─────────────────────────────────────────────
export { review } from './review.js';
export type {
  ReviewRequest,
  ReviewResult,
  ReviewComment,
  ReviewCycleState,
} from './review.js';

// ── Release Pipeline (Phase 6) ──────────────────────────────────────────────
export { releasePipeline } from './release.js';
export type { ReleaseState } from './release.js';

// ── Maintenance (Phase 7) ───────────────────────────────────────────────────
export { maintenance } from './maintenance.js';
export {
  vulnerabilityToExpectation,
  customerReportToExpectation,
  incidentToExpectation,
} from './maintenance.js';
export type {
  Vulnerability,
  DependencyUpdate,
  CustomerReport,
  Incident,
} from './maintenance.js';

// ── Technical Writer (Phase 8) ──────────────────────────────────────────────
export { docs, defaultTemplates, defaultDocsConfig } from './docs.js';
export {
  auditDocs,
  planDocsUpdate,
  validateAgainstTemplate,
} from './docs.js';
export type {
  TrackedDocument,
  DocumentType,
  DocumentTemplate,
  TemplateSection,
  DocsAuditResult,
  DocsConfig,
  CodeChange,
  DocsUpdatePlan,
  TemplateValidationResult,
} from './docs.js';
