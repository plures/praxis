/**
 * Praxis Unified Reactive Layer — Types
 *
 * The types that define the unified state/rules/logging surface.
 * Developers interact with query() and mutate() — everything else is internal.
 */

import type { PraxisFact, PraxisDiagnostics } from '../core/protocol.js';

// ── Store Contract ──────────────────────────────────────────────────────────
// Any reactive store that supports subscribe(). Works with Svelte writable,
// Solid signals, or any framework with a subscribe pattern.

/** Minimal store contract — anything with subscribe() */
export interface Subscribable<T> {
  subscribe(cb: (value: T) => void): (() => void) | { unsubscribe(): void };
}

/** Writable store contract — subscribe + set + update */
export interface WritableStore<T> extends Subscribable<T> {
  set(value: T): void;
  update(updater: (current: T) => T): void;
}

// ── Graph Schema ────────────────────────────────────────────────────────────

/** Schema definition for a graph path */
export interface PathSchema<T = unknown> {
  /** The graph path (e.g., 'sprint/current') */
  path: string;
  /** Default/initial value */
  initial: T;
  /** Optional TTL for staleness detection (ms) */
  staleTtl?: number;
  /** Whether this path is a collection (maps over children) */
  collection?: boolean;
}

/**
 * Define a typed graph path.
 * This is the primary API for declaring what data exists in your app.
 *
 * @param path - The path key in the reactive graph (e.g. `'sprint/current'`)
 * @param initial - The initial value at this path before any mutations
 * @param opts - Optional path options: `collection`, `liveness`, `description`
 * @returns A {@link PathSchema} descriptor used in {@link PraxisAppConfig.schema}
 *
 * @example
 * const Sprint = definePath<SprintInfo | null>('sprint/current', null);
 * const Items = definePath<WorkItem[]>('sprint/items', [], { collection: true });
 * const Loading = definePath<boolean>('sprint/loading', false);
 */
export function definePath<T>(
  path: string,
  initial: T,
  opts?: Omit<PathSchema<T>, 'path' | 'initial'>
): PathSchema<T> {
  return { path, initial, ...opts };
}

// ── Query Options ───────────────────────────────────────────────────────────

/** Options for filtering, mapping, and sorting query results. */
export interface QueryOptions<T> {
  /** Filter function for collections */
  where?: (item: T extends (infer U)[] ? U : T) => boolean;
  /** Select/map function */
  select?: (item: T) => unknown;
  /** Sort comparator */
  sort?: (a: unknown, b: unknown) => number;
  /** Limit results */
  limit?: number;
}

// ── Reactive Query Result ───────────────────────────────────────────────────

/**
 * A reactive reference returned by query().
 * Has a Svelte-compatible subscribe() and a .current getter.
 */
export interface ReactiveRef<T> extends Subscribable<T> {
  /** Current value (synchronous read) */
  readonly current: T;
  /** Svelte store contract — subscribe returns unsubscribe fn */
  subscribe(cb: (value: T) => void): () => void;
}

// ── Mutation Result ─────────────────────────────────────────────────────────

/** Result returned by `app.mutate()` — accepted status, violations, and emitted facts. */
export interface MutationResult {
  /** Whether the mutation was accepted */
  accepted: boolean;
  /** Constraint violations that blocked the mutation (if any) */
  violations: PraxisDiagnostics[];
  /** Facts emitted by rules triggered by this mutation */
  facts: PraxisFact[];
}

// ── Rule Definition (v2) ────────────────────────────────────────────────────

/** A reactive rule definition for the unified API — watches graph paths and emits facts. */
export interface UnifiedRule {
  /** Unique rule ID */
  id: string;
  /** Human-readable description */
  description?: string;
  /** Graph paths this rule watches — auto-subscribed */
  watch: string[];
  /** Rule evaluation function — receives watched values by path */
  evaluate: (values: Record<string, unknown>, facts: PraxisFact[]) => import('../core/rule-result.js').RuleResult;
}

// ── Constraint Definition (v2) ──────────────────────────────────────────────

/** A reactive constraint definition for the unified API — validates graph path values. */
export interface UnifiedConstraint {
  /** Unique constraint ID */
  id: string;
  /** Human-readable description */
  description?: string;
  /** Graph paths this constraint reads */
  watch: string[];
  /** Validation function — return true if valid, string if violated */
  validate: (values: Record<string, unknown>) => true | string;
}

// ── Liveness Monitor ────────────────────────────────────────────────────────

/** Liveness monitoring configuration — detect stale paths after initialization. */
export interface LivenessConfig {
  /** Paths that must update within `timeoutMs` after init */
  expect: string[];
  /** Milliseconds to wait before flagging staleness (default: 5000) */
  timeoutMs?: number;
  /** Callback when a path is stale */
  onStale?: (path: string, elapsed: number) => void;
}

// ── App Definition ──────────────────────────────────────────────────────────

/** Configuration passed to `createApp()` — schema, rules, constraints, and liveness options. */
export interface PraxisAppConfig {
  /** App name (used in Chronos context) */
  name: string;
  /** Graph schema — all paths the app uses */
  schema: PathSchema[];
  /** Business rules */
  rules?: UnifiedRule[];
  /** Constraints */
  constraints?: UnifiedConstraint[];
  /** Liveness monitoring */
  liveness?: LivenessConfig;
  /** Chronos options */
  chronos?: {
    batchMs?: number;
    maxBatch?: number;
  };
}
