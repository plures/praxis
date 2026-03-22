/**
 * Praxis Lifecycle Engine — Types
 *
 * The lifecycle engine turns software development into a state machine.
 * Every transition is a Praxis event. Actions at each state are extensible triggers.
 */

// ─── Lifecycle Expectation (replaces issues) ────────────────────────────────

/** The type of work an expectation represents */
export type ExpectationType =
  | 'feature'       // New functionality
  | 'fix'           // Bug fix
  | 'security'      // Security vulnerability
  | 'performance'   // Performance improvement
  | 'chore'         // Maintenance, refactoring
  | 'docs'          // Documentation
  | 'deprecation';  // Removing functionality

/** Priority level */
export type ExpectationPriority = 'critical' | 'high' | 'medium' | 'low';

/** Lifecycle expectation — the single entry point for all work */
export interface LifecycleExpectation {
  /** Unique ID (e.g., 'user-auth-flow') */
  id: string;
  /** What kind of work this is */
  type: ExpectationType;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description: string;
  /** Priority */
  priority: ExpectationPriority;
  /** Acceptance criteria — Given/When/Then or plain strings */
  acceptance: string[];
  /** Breaking change? Forces major version bump */
  breaking?: boolean;
  /** Labels for categorization */
  labels?: string[];
  /** Related expectation IDs */
  related?: string[];
  /** Metadata (extensible) */
  meta?: Record<string, unknown>;
}

// ─── Lifecycle Events ───────────────────────────────────────────────────────

/** All lifecycle event names (hierarchical) */
export type LifecycleEventName =
  // Design phase
  | 'lifecycle/design/repo.created'
  | 'lifecycle/design/expectation.submitted'
  | 'lifecycle/design/expectation.classified'
  | 'lifecycle/design/expectation.prioritized'
  // Develop phase
  | 'lifecycle/develop/work.assigned'
  | 'lifecycle/develop/branch.created'
  | 'lifecycle/develop/commit.validated'
  | 'lifecycle/develop/commit.pushed'
  | 'lifecycle/develop/work.completed'
  // Review phase
  | 'lifecycle/review/review.requested'
  | 'lifecycle/review/review.completed'
  | 'lifecycle/review/review.changes-requested'
  | 'lifecycle/review/review.changes-applied'
  | 'lifecycle/review/review.approved'
  // Integration phase
  | 'lifecycle/integrate/ci.triggered'
  | 'lifecycle/integrate/ci.passed'
  | 'lifecycle/integrate/ci.failed'
  | 'lifecycle/integrate/merge.executed'
  | 'lifecycle/integrate/merge.conflict'
  // Version phase
  | 'lifecycle/version/semver.bumped'
  | 'lifecycle/version/semver.synced'
  | 'lifecycle/version/prerelease.tagged'
  | 'lifecycle/version/prerelease.published'
  | 'lifecycle/version/release.tagged'
  // QA phase
  | 'lifecycle/qa/qa.test-case-generated'
  | 'lifecycle/qa/qa.suite-triggered'
  | 'lifecycle/qa/qa.branch-created'
  | 'lifecycle/qa/qa.passed'
  | 'lifecycle/qa/qa.failed'
  | 'lifecycle/qa/qa.regression-found'
  | 'lifecycle/qa/qa.artifacts-committed'
  // Release phase
  | 'lifecycle/release/release.requested'
  | 'lifecycle/release/release.approved'
  | 'lifecycle/release/release.published'
  | 'lifecycle/release/release.announced'
  | 'lifecycle/release/release.deployed'
  // Maintenance phase
  | 'lifecycle/maintain/vulnerability.detected'
  | 'lifecycle/maintain/dependency.outdated'
  | 'lifecycle/maintain/customer.reported'
  | 'lifecycle/maintain/incident.triggered';

/** Lifecycle event payload */
export interface LifecycleEvent {
  /** Event name from the taxonomy */
  name: LifecycleEventName;
  /** The expectation this event relates to (if any) */
  expectationId?: string;
  /** Timestamp */
  timestamp: number;
  /** Arbitrary payload */
  data: Record<string, unknown>;
  /** Source of the event (e.g., 'git-hook', 'ci', 'manual') */
  source: string;
}

// ─── Trigger System ─────────────────────────────────────────────────────────

/** A trigger action — what happens when a lifecycle event fires */
export interface TriggerAction {
  /** Unique action ID */
  id: string;
  /** Human-readable description */
  description?: string;
  /** The handler function — receives the event and returns results */
  execute: (event: LifecycleEvent, ctx: TriggerContext) => Promise<TriggerResult>;
}

/** Context available to trigger handlers */
export interface TriggerContext {
  /** The expectation that triggered this (if any) */
  expectation?: LifecycleExpectation;
  /** All expectations in the project */
  expectations: Map<string, LifecycleExpectation>;
  /** Project configuration */
  config: LifecycleConfig;
  /** Emit a new lifecycle event (for chaining) */
  emit: (name: LifecycleEventName, data: Record<string, unknown>) => void;
  /** Register a new expectation */
  addExpectation: (expectation: LifecycleExpectation) => void;
  /** Get all expectations */
  getAllExpectations: () => LifecycleExpectation[];
}

/** Result of a trigger action */
export interface TriggerResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Human-readable summary */
  message: string;
  /** Output data (e.g., issue URL, PR number) */
  data?: Record<string, unknown>;
  /** Errors */
  error?: string;
}

/** Trigger definition — maps an event to actions */
export interface TriggerDefinition {
  /** The lifecycle event this trigger fires on */
  on: LifecycleEventName;
  /** Optional filter — only fire if condition matches */
  when?: (event: LifecycleEvent) => boolean;
  /** Actions to execute (in order) */
  actions: TriggerAction[];
}

// ─── Lifecycle Configuration ────────────────────────────────────────────────

/** Full lifecycle configuration for a project */
export interface LifecycleConfig {
  /** Project name */
  name: string;
  /** Trigger definitions */
  triggers: TriggerDefinition[];
  /** Version engine config */
  versioning?: VersioningConfig;
  /** QA config */
  qa?: QAConfig;
  /** Template name this was created from */
  template?: string;
  /** Custom metadata */
  meta?: Record<string, unknown>;
}

/** Versioning configuration */
export interface VersioningConfig {
  /** Semver strategy */
  strategy: 'conventional' | 'expectation-driven';
  /** Files that contain version strings */
  versionFiles: string[];
  /** Prerelease tag format (default: 'rc') */
  prereleaseTag?: string;
}

/** QA configuration */
export interface QAConfig {
  /** Branch naming for QA branches */
  branchPrefix: string;
  /** Test matrix file location */
  matrixPath?: string;
  /** Artifact output directory */
  artifactsDir: string;
}

// ─── Classification ─────────────────────────────────────────────────────────

/** Result of classifying an expectation */
export interface ClassificationResult {
  /** Determined type */
  type: ExpectationType;
  /** Confidence (0-1) */
  confidence: number;
  /** Reasoning */
  reason: string;
  /** Suggested priority adjustment */
  suggestedPriority?: ExpectationPriority;
  /** Suggested labels */
  suggestedLabels?: string[];
}

// ─── Trigger Adapters (pluggable backends) ──────────────────────────────────

/** GitHub adapter options */
export interface GitHubTriggerOptions {
  owner: string;
  repo: string;
  assignee?: string;
  labels?: string[];
}

/** GitLab adapter options */
export interface GitLabTriggerOptions {
  projectId: string | number;
  assignee?: string;
  labels?: string[];
  board?: string;
}

/** Agent adapter options (for Pares Agens, OpenClaw subagent, etc.) */
export interface AgentTriggerOptions {
  agentId: string;
  model?: string;
  timeout?: number;
}

/** Registry publish options */
export interface RegistryPublishOptions {
  registries: ('npm' | 'jsr' | 'crates' | 'pypi' | 'nuget')[];
  access?: 'public' | 'restricted';
  tag?: string;
}
