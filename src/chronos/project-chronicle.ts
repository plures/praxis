/**
 * Project Chronicle — Core Event Store
 *
 * Records project lifecycle events (rule registrations, contract changes,
 * gate transitions, build events, etc.) as a queryable, append-only log.
 *
 * This is the development-lifecycle counterpart to runtime Chronos:
 * where runtime Chronos records "user typed, rule fired, fact emitted",
 * project-level Chronos records "rule registered, contract updated,
 * gate opened, completeness score changed."
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** The kind of project lifecycle event. */
export type ProjectEventKind =
  | 'rule'
  | 'contract'
  | 'expectation'
  | 'gate'
  | 'build'
  | 'fact';

/**
 * A single project lifecycle event.
 *
 * Immutable once recorded — the chronicle is append-only.
 */
export interface ProjectEvent {
  /** Event kind (rule, contract, expectation, gate, build, fact). */
  kind: ProjectEventKind;
  /**
   * Action that occurred.
   * Examples: 'registered', 'modified', 'removed', 'satisfied', 'violated',
   *           'opened', 'closed', 'blocked', 'audit-complete', 'introduced', 'deprecated'.
   */
  action: string;
  /** The subject (rule id, contract id, gate name, fact tag, etc.). */
  subject: string;
  /** Unix ms timestamp. */
  timestamp: number;
  /** Arbitrary metadata for this event. */
  metadata: Record<string, unknown>;
  /** Optional before/after diff for modifications. */
  diff?: { before: unknown; after: unknown };
}

/** Options for creating a ProjectChronicle. */
export interface ProjectChronicleOptions {
  /** Maximum events to retain (0 = unlimited, default 10_000). */
  maxEvents?: number;
  /** Optional clock function (for testing). */
  now?: () => number;
}

// ─── ProjectChronicle ───────────────────────────────────────────────────────

/**
 * In-memory, append-only chronicle of project lifecycle events.
 *
 * Thread-safe for single-threaded JS; immutable snapshots via `getEvents()`.
 */
export class ProjectChronicle {
  private events: ProjectEvent[] = [];
  private readonly maxEvents: number;
  private readonly now: () => number;

  constructor(options: ProjectChronicleOptions = {}) {
    this.maxEvents = options.maxEvents ?? 10_000;
    this.now = options.now ?? (() => Date.now());
  }

  // ── Recording ───────────────────────────────────────────────────────────

  /**
   * Record a project event. Returns the recorded event (with timestamp filled in).
   */
  record(
    event: Omit<ProjectEvent, 'timestamp'> & { timestamp?: number },
  ): ProjectEvent {
    const full: ProjectEvent = {
      kind: event.kind,
      action: event.action,
      subject: event.subject,
      timestamp: event.timestamp ?? this.now(),
      metadata: event.metadata,
      diff: event.diff,
    };
    this.events.push(full);

    // Evict oldest if over cap
    if (this.maxEvents > 0 && this.events.length > this.maxEvents) {
      this.events = this.events.slice(this.events.length - this.maxEvents);
    }

    return full;
  }

  // ── Convenience recorders ─────────────────────────────────────────────

  recordRuleRegistered(ruleId: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'rule', action: 'registered', subject: ruleId, metadata: meta });
  }

  recordRuleModified(
    ruleId: string,
    diff: { before: unknown; after: unknown },
    meta: Record<string, unknown> = {},
  ): ProjectEvent {
    return this.record({ kind: 'rule', action: 'modified', subject: ruleId, metadata: meta, diff });
  }

  recordRuleRemoved(ruleId: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'rule', action: 'removed', subject: ruleId, metadata: meta });
  }

  recordContractAdded(contractId: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'contract', action: 'added', subject: contractId, metadata: meta });
  }

  recordContractModified(
    contractId: string,
    diff: { before: unknown; after: unknown },
    meta: Record<string, unknown> = {},
  ): ProjectEvent {
    return this.record({ kind: 'contract', action: 'modified', subject: contractId, metadata: meta, diff });
  }

  recordExpectationSatisfied(name: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'expectation', action: 'satisfied', subject: name, metadata: meta });
  }

  recordExpectationViolated(name: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'expectation', action: 'violated', subject: name, metadata: meta });
  }

  recordGateTransition(
    gateName: string,
    from: string,
    to: string,
    meta: Record<string, unknown> = {},
  ): ProjectEvent {
    return this.record({
      kind: 'gate',
      action: to,
      subject: gateName,
      metadata: { ...meta, from, to },
      diff: { before: from, after: to },
    });
  }

  recordBuildAudit(
    score: number,
    delta: number,
    meta: Record<string, unknown> = {},
  ): ProjectEvent {
    return this.record({
      kind: 'build',
      action: 'audit-complete',
      subject: 'completeness',
      metadata: { ...meta, score, delta },
    });
  }

  recordFactIntroduced(factTag: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'fact', action: 'introduced', subject: factTag, metadata: meta });
  }

  recordFactDeprecated(factTag: string, meta: Record<string, unknown> = {}): ProjectEvent {
    return this.record({ kind: 'fact', action: 'deprecated', subject: factTag, metadata: meta });
  }

  // ── Access ──────────────────────────────────────────────────────────────

  /** Return a shallow copy of all events. */
  getEvents(): ProjectEvent[] {
    return [...this.events];
  }

  /** Total number of recorded events. */
  get size(): number {
    return this.events.length;
  }

  /** Clear all events (primarily for testing). */
  clear(): void {
    this.events = [];
  }
}

/**
 * Create a new ProjectChronicle instance.
 */
export function createProjectChronicle(
  options?: ProjectChronicleOptions,
): ProjectChronicle {
  return new ProjectChronicle(options);
}
